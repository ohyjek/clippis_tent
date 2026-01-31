/**
 * DrawingPreview.tsx - Preview rectangle while drawing a room
 *
 * Shows a dashed rectangle following the mouse during room creation.
 */
import type { Position } from "../../context/types";
import { toPercent } from "../../utils";
import styles from "./SpatialCanvas.module.css";

interface DrawingPreviewProps {
  start: () => Position | null;
  end: () => Position | null;
}

export function DrawingPreview(props: DrawingPreviewProps) {
  const start = () => props.start();
  const end = () => props.end();

  const left = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.min(toPercent(s.x), toPercent(e.x));
  };

  const top = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.min(toPercent(s.y), toPercent(e.y));
  };

  const widthPct = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.abs(toPercent(e.x) - toPercent(s.x));
  };

  const heightPct = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.abs(toPercent(e.y) - toPercent(s.y));
  };

  const dimensions = () => {
    const s = start();
    const e = end();
    if (!s || !e) return "0.0 × 0.0";
    const w = Math.abs(e.x - s.x).toFixed(1);
    const h = Math.abs(e.y - s.y).toFixed(1);
    return `${w} × ${h}`;
  };

  return (
    <div
      class={styles.drawPreview}
      style={{
        left: `${left()}%`,
        top: `${top()}%`,
        width: `${widthPct()}%`,
        height: `${heightPct()}%`,
      }}
      data-dimensions={dimensions()}
    />
  );
}
