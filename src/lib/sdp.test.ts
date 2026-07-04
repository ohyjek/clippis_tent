/**
 * sdp.test.ts - Unit tests for SDP normalization and paste validation
 */

import { normalizeSdp, validatePastedSdp } from "@lib/sdp";
import { describe, expect, it } from "vitest";

// A realistic-length SDP (validation requires >= 200 chars + an m= line)
const VALID_SDP_BODY = [
  "v=0",
  "o=- 4611731400430051336 2 IN IP4 127.0.0.1",
  "s=-",
  "t=0 0",
  "a=group:BUNDLE 0",
  "a=msid-semantic: WMS stream",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111",
  "c=IN IP4 0.0.0.0",
  "a=rtcp:9 IN IP4 0.0.0.0",
  "a=ice-ufrag:mock",
  "a=ice-pwd:mockmockmockmockmockmock",
  "a=fingerprint:sha-256 00:00",
  "a=rtpmap:111 opus/48000/2",
].join("\r\n");

describe("normalizeSdp", () => {
  it("terminates the output with CRLF (Chromium rejects the last line otherwise)", () => {
    const out = normalizeSdp("v=0\no=- 1 2 IN IP4 127.0.0.1");

    expect(out.endsWith("\r\n")).toBe(true);
    expect(out).toBe("v=0\r\no=- 1 2 IN IP4 127.0.0.1\r\n");
  });

  it("strips control characters and null bytes from clipboard cruft", () => {
    const out = normalizeSdp("v=0\x00\x01\x02\ns=-\x7f");

    expect(out).toBe("v=0\r\ns=-\r\n");
  });

  it("splits a merged line before m= so the parser sees the m= line", () => {
    const out = normalizeSdp("a=msid-semantic: WMS m=audio 9 UDP/TLS/RTP/SAVPF 111");

    expect(out).toBe("a=msid-semantic: WMS\r\nm=audio 9 UDP/TLS/RTP/SAVPF 111\r\n");
  });

  it("drops telephone-event rtpmap lines (Chromium parser rejects them)", () => {
    const out = normalizeSdp("v=0\na=rtpmap:110 telephone-event/48000\na=rtpmap:111 opus/48000/2");

    expect(out).not.toContain("telephone-event");
    expect(out).toContain("a=rtpmap:111 opus/48000/2");
  });

  it("is idempotent on already-clean SDP", () => {
    const once = normalizeSdp(VALID_SDP_BODY);

    expect(normalizeSdp(once)).toBe(once);
  });
});

describe("validatePastedSdp", () => {
  it("accepts a realistic SDP with an audio m= line", () => {
    expect(validatePastedSdp(VALID_SDP_BODY)).toBeNull();
  });

  it("accepts a realistic SDP with a video m= line", () => {
    const videoSdp = VALID_SDP_BODY.replace(
      "m=audio 9 UDP/TLS/RTP/SAVPF 111",
      "m=video 9 UDP/TLS/RTP/SAVPF 96"
    );

    expect(validatePastedSdp(videoSdp)).toBeNull();
  });

  it("rejects a short paste and reports its trimmed length", () => {
    const error = validatePastedSdp("  invalid-sdp  ");

    expect(error).toContain("too short (11 chars)");
  });

  it("rejects a long paste that has no media line", () => {
    expect(validatePastedSdp("x".repeat(300))).not.toBeNull();
  });
});
