/**
 * WebRTC.tsx - The WebRTC page
 *
 * Signaling flow: Run `pnpm signaling` in a terminal. Both peers: Connect, then one clicks
 * Create offer (connection, mic, and answer are automatic). Offer/answer/ICE go over the wire.
 *
 * Manual flow: Use the sections below to copy-paste SDP and ICE between windows.
 *
 * Remote audio plays here un-spatialized; open the Tent page for spatialized playback.
 */

import { webRTCStore } from "@stores/webRTC";
import { createEffect, createSignal, onCleanup } from "solid-js";
import styles from "./WebRTC.module.css";

export function WebRTC() {
  const [remoteSdpPaste, setRemoteSdpPaste] = createSignal("");
  const [remoteIcePaste, setRemoteIcePaste] = createSignal("");

  // Plain (non-spatial) playback of the remote peer so this page is self-sufficient
  let remoteAudioRef: HTMLAudioElement | undefined;
  createEffect(() => {
    const stream = webRTCStore.remoteStream();
    if (remoteAudioRef) {
      remoteAudioRef.srcObject = stream;
      if (stream) {
        void remoteAudioRef.play().catch(() => {
          /* autoplay restrictions — playback starts on next user gesture */
        });
      }
    }
  });
  // A detached media element keeps playing its stream — stop it on unmount or
  // it double-plays (un-spatialized) on top of the Tent's spatial pipeline
  onCleanup(() => {
    if (remoteAudioRef) {
      remoteAudioRef.pause();
      remoteAudioRef.srcObject = null;
    }
  });

  const setRemoteOffer = () => webRTCStore.setRemoteSdp(remoteSdpPaste().trim(), "offer");
  const setRemoteAnswer = () => webRTCStore.setRemoteSdp(remoteSdpPaste().trim(), "answer");

  const pasteFromClipboardAndSetOffer = async () => {
    try {
      const sdp = await navigator.clipboard.readText();
      await webRTCStore.setRemoteSdp(sdp, "offer");
    } catch (e) {
      console.error("Clipboard read failed", e);
    }
  };
  const pasteFromClipboardAndSetAnswer = async () => {
    try {
      const sdp = await navigator.clipboard.readText();
      await webRTCStore.setRemoteSdp(sdp, "answer");
    } catch (e) {
      console.error("Clipboard read failed", e);
    }
  };

  const addPastedIceCandidates = async () => {
    const text = remoteIcePaste().trim();
    if (!text) return;
    // Accept what "Copy ICE" produces (a JSON array) as well as a single
    // candidate object or one JSON object per line
    let candidates: (RTCIceCandidateInit | string)[];
    try {
      const parsed = JSON.parse(text) as RTCIceCandidateInit | RTCIceCandidateInit[];
      candidates = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      candidates = text
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    for (const candidate of candidates) {
      await webRTCStore.addIceCandidate(candidate);
    }
  };

  const localIceJson = () => JSON.stringify(webRTCStore.localIceCandidates(), null, 2);

  const copyLocalSdp = () => {
    const sdp = webRTCStore.localSdp() ?? "";
    if (sdp) navigator.clipboard.writeText(sdp);
  };
  const copyLocalIce = () => {
    const json = localIceJson();
    if (json !== "[]") navigator.clipboard.writeText(json);
  };

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>WebRTC testing</h1>
        <p class={styles.subtitle}>
          Connection state: <strong>{webRTCStore.connectionState() ?? "—"}</strong>
          {webRTCStore.signalingConnected() && " · Signaling: connected"}
          {webRTCStore.dataChannelOpen() && " · DataChannel: open"}
          {webRTCStore.localStream() && " · Mic: sending"}
          {webRTCStore.remoteStream() && " · Remote audio: receiving"}
        </p>
        <p class={styles.hint}>
          Remote peer position: {(() => {
            const peer = webRTCStore.remotePeerState();
            return peer
              ? `x=${peer.position.x.toFixed(2)}, y=${peer.position.y.toFixed(2)}, facing=${peer.facing.toFixed(2)}`
              : "— (none received yet)";
          })()}
        </p>
        {/* biome-ignore lint/a11y/useMediaCaption: live WebRTC voice stream — captions don't apply */}
        <audio ref={remoteAudioRef} autoplay />

        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>Signaling (run pnpm signaling first)</h2>
          <p class={styles.hint}>
            Start the server in a terminal: <code>pnpm signaling</code>. Then both peers connect and
            init; one clicks Create offer — offer/answer/ICE go over the wire.
          </p>
          <div class={styles.buttonRow}>
            <button
              class={styles.button}
              type="button"
              onClick={() => webRTCStore.connectSignaling()}
              disabled={webRTCStore.signalingConnected()}
            >
              Connect to signaling
            </button>
            <button
              class={styles.button}
              type="button"
              onClick={() => webRTCStore.disconnectSignaling()}
              disabled={!webRTCStore.signalingConnected()}
            >
              Disconnect signaling
            </button>
          </div>
        </section>

        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>Init &amp; create offer</h2>
          <button
            type="button"
            class={styles.button}
            onClick={() => webRTCStore.initializePeerConnection()}
          >
            Initialize peer connection
          </button>
          <button type="button" class={styles.button} onClick={() => webRTCStore.createOffer()}>
            Create offer
            {webRTCStore.signalingConnected()
              ? " (sends via signaling)"
              : " (copy SDP below for manual)"}
          </button>
          <button type="button" class={styles.button} onClick={() => webRTCStore.createAnswer()}>
            Create answer (manual only; with signaling the other peer auto-responds)
          </button>
        </section>

        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>2. Local SDP (copy to other peer)</h2>
          <div class={styles.copyRow}>
            <button
              class={styles.button}
              type="button"
              onClick={copyLocalSdp}
              disabled={!webRTCStore.localSdp()}
            >
              Copy SDP
            </button>
          </div>
          <textarea
            class={styles.textarea}
            readOnly
            value={webRTCStore.localSdp() ?? ""}
            placeholder="After Create offer / Create answer, copy this to the other window."
          />
        </section>

        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>3. Remote SDP (paste from other peer)</h2>
          <p class={styles.hint}>
            In the other window click &quot;Copy SDP&quot;, then here click one of the buttons below
            (or paste in the box and click Set).
          </p>
          <div class={styles.buttonRow}>
            <button class={styles.button} type="button" onClick={pasteFromClipboardAndSetOffer}>
              Paste from clipboard and set remote offer
            </button>
            <button class={styles.button} type="button" onClick={pasteFromClipboardAndSetAnswer}>
              Paste from clipboard and set remote answer
            </button>
          </div>
          <textarea
            class={styles.textarea}
            placeholder="Or paste the other peer's SDP here, then click Set below"
            onInput={(e) => setRemoteSdpPaste(e.currentTarget.value)}
          />
          <div class={styles.buttonRow}>
            <button type="button" class={styles.button} onClick={setRemoteOffer}>
              Set remote offer
            </button>
            <button type="button" class={styles.button} onClick={setRemoteAnswer}>
              Set remote answer
            </button>
          </div>
        </section>

        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>4. Local ICE candidates (copy to other peer)</h2>
          <div class={styles.copyRow}>
            <button
              class={styles.button}
              type="button"
              onClick={copyLocalIce}
              disabled={localIceJson() === "[]"}
            >
              Copy ICE
            </button>
          </div>
          <textarea
            class={styles.textarea}
            readOnly
            value={localIceJson()}
            placeholder="ICE candidates appear here after offer/answer. Copy to other peer."
          />
        </section>

        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>
            5. Remote ICE (paste from other peer, one JSON per line)
          </h2>
          <textarea
            class={styles.textarea}
            placeholder='Paste ICE candidate(s) as JSON, one per line, e.g. {"candidate":"...","sdpMid":"0","sdpMLineIndex":0}'
            onInput={(e) => setRemoteIcePaste(e.currentTarget.value)}
          />
          <button type="button" class={styles.button} onClick={addPastedIceCandidates}>
            Add ICE candidates
          </button>
        </section>

        <section class={styles.section}>
          <button
            type="button"
            class={styles.buttonDanger}
            onClick={() => webRTCStore.disconnect()}
          >
            Disconnect
          </button>
        </section>
      </header>
    </div>
  );
}
