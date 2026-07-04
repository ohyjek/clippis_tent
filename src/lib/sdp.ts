/**
 * sdp.ts - Pure SDP helpers for the WebRTC store (normalization + paste validation).
 */

/** Normalize SDP so setRemoteDescription parses correctly: CRLF line endings, trim each line (fixes "Invalid SDP line" from clipboard cruft), fix merged lines. */
export function normalizeSdp(sdp: string): string {
  // Strip control chars and null bytes that can come from clipboard
  // biome-ignore lint/suspicious/noControlCharactersInRegex: intentional — strip control characters from pasted SDP
  let out = sdp.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  out = out.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  // If paste merged lines (e.g. "a=msid-semantic: WMS m=audio ..."), split before " m=" so parser sees m= line
  out = out.replace(/\s+(m=)/g, "\n$1");
  // Trim each line; drop telephone-event rtpmap lines (Chromium parser rejects them; optional for DTMF)
  out = out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !/^a=rtpmap:\d+ telephone-event\//.test(line))
    .join("\r\n");
  // Chromium's parser requires the final line to be newline-terminated —
  // without this every normalized SDP fails with "Invalid SDP line" on its last line
  return `${out}\r\n`;
}

/**
 * Sanity-check a pasted SDP before attempting to apply it (catches partial
 * selections and hand-typed text).
 * @returns an error message to show the user, or null when the SDP looks valid
 */
export function validatePastedSdp(sdp: string): string | null {
  const trimmed = sdp.trim();
  if (trimmed.length < 200 || !/m=audio|m=video/.test(trimmed)) {
    return `Pasted SDP too short (${trimmed.length} chars) or invalid. In the OTHER window click "Copy SDP" then paste here — don't type or select from the box.`;
  }
  return null;
}
