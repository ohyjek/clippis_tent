/**
 * webrtc.spec.ts - Two-client voice chat end-to-end
 *
 * Drives two browser contexts with fake microphones through the signaling
 * flow and asserts the full contract: connection reaches "connected", audio
 * bytes flow in BOTH directions, the receiving peer gets an audible signal
 * (not just packets), and position syncs over the DataChannel.
 *
 * Relies on the dev-only window.__webRTCStore exposure (import.meta.env.DEV)
 * and the signaling relay from playwright.config.ts's second webServer.
 */
import { expect, type Page, test } from "@playwright/test";

test.use({
  launchOptions: {
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
      "--autoplay-policy=no-user-gesture-required",
    ],
  },
});

declare global {
  interface Window {
    __webRTCStore?: {
      connectionState: () => string | null;
      peerConnection: () => RTCPeerConnection | null;
      remoteStream: () => MediaStream | null;
    };
  }
}

async function inboundAudioBytes(page: Page): Promise<number> {
  return page.evaluate(async () => {
    const pc = window.__webRTCStore?.peerConnection();
    if (!pc) return -1;
    const stats = await pc.getStats();
    let rx = 0;
    stats.forEach((r) => {
      const report = r as unknown as { type: string; kind?: string; bytesReceived?: number };
      if (report.type === "inbound-rtp" && report.kind === "audio") rx += report.bytesReceived ?? 0;
    });
    return rx;
  });
}

test("two clients establish voice chat and sync position over the DataChannel", async ({
  browser,
}) => {
  test.setTimeout(90_000);

  const makePeer = async () => {
    const context = await browser.newContext({ permissions: ["microphone"] });
    const page = await context.newPage();
    await page.goto("/webrtc");
    await page.getByRole("button", { name: "Connect to signaling" }).click();
    await expect(page.getByText("Signaling: connected")).toBeVisible({ timeout: 10_000 });
    return page;
  };

  const peerA = await makePeer();
  const peerB = await makePeer();

  await peerA.getByRole("button", { name: /Create offer/ }).click();

  for (const page of [peerA, peerB]) {
    await page.waitForFunction(
      () => window.__webRTCStore?.connectionState() === "connected",
      null,
      {
        timeout: 25_000,
      }
    );
  }

  // Audio must flow BOTH ways: sample inbound-rtp bytes twice on each side
  const [a1, b1] = [await inboundAudioBytes(peerA), await inboundAudioBytes(peerB)];
  await peerA.waitForTimeout(2_000);
  const [a2, b2] = [await inboundAudioBytes(peerA), await inboundAudioBytes(peerB)];
  expect(a2, "audio bytes B->A should increase").toBeGreaterThan(a1);
  expect(b2, "audio bytes A->B should increase").toBeGreaterThan(b1);

  // Packets are not enough — assert B receives an audible signal (fake mic tone)
  const rms = await peerB.evaluate(async () => {
    const stream = window.__webRTCStore?.remoteStream();
    if (!stream) return -1;
    const ctx = new AudioContext();
    await ctx.resume();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    ctx.createMediaStreamSource(stream).connect(analyser);
    await new Promise((r) => setTimeout(r, 700));
    const buf = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(buf);
    let sum = 0;
    for (const v of buf) sum += v * v;
    return Math.sqrt(sum / buf.length);
  });
  expect(rms, "remote stream should carry audible signal").toBeGreaterThan(0.001);

  // A moves to the Tent (SPA nav — a full reload would tear down the peer
  // connection); its DemoContext sends position over the DataChannel and B
  // renders it on the WebRTC page.
  await peerA.getByRole("link", { name: "The Tent", exact: true }).click();
  await expect(peerB.getByText(/x=.*y=.*facing=/)).toBeVisible({ timeout: 15_000 });
});
