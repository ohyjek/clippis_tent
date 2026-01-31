/**
 * useDragHandler.ts - Reusable drag interaction hook
 *
 * Encapsulates the common pattern of handling mousedown → mousemove → mouseup
 * for dragging elements. Prevents event bubbling and handles cleanup.
 *
 * @example
 * const handleDrag = useDragHandler({
 *   onStart: () => setIsDragging(true),
 *   onMove: (e) => setPosition(getPositionFromEvent(e)),
 *   onEnd: () => setIsDragging(false),
 * });
 *
 * <div onMouseDown={handleDrag}>Drag me</div>
 */

interface DragHandlerOptions {
  /** Called when drag starts (mousedown) */
  onStart?: (e: MouseEvent) => void;
  /** Called during drag (mousemove) */
  onMove: (e: MouseEvent) => void;
  /** Called when drag ends (mouseup) */
  onEnd?: (e: MouseEvent) => void;
  /** Whether to stop event propagation (default: true) */
  stopPropagation?: boolean;
  /** Whether to prevent default behavior (default: true) */
  preventDefault?: boolean;
}

/**
 * Creates a mousedown handler that sets up drag tracking
 */
export function useDragHandler(options: DragHandlerOptions) {
  const { onStart, onMove, onEnd, stopPropagation = true, preventDefault = true } = options;

  return (e: MouseEvent) => {
    if (stopPropagation) e.stopPropagation();
    if (preventDefault) e.preventDefault();

    onStart?.(e);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      onMove(moveEvent);
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      onEnd?.(upEvent);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
}

/**
 * Creates a rotation drag handler with angle tracking
 *
 * Handles the common pattern of rotating an element by dragging,
 * tracking the delta angle from the initial mouse position.
 */
interface RotationHandlerOptions {
  /** Get the center point of rotation in screen coordinates */
  getCenter: () => { x: number; y: number };
  /** Get the current angle in radians */
  getCurrentAngle: () => number;
  /** Called when rotation starts */
  onStart?: () => void;
  /** Called during rotation with the new angle */
  onRotate: (angle: number) => void;
  /** Called when rotation ends with the final normalized angle */
  onEnd?: (normalizedAngle: number) => void;
}

export function useRotationHandler(options: RotationHandlerOptions) {
  const { getCenter, getCurrentAngle, onStart, onRotate, onEnd } = options;

  return (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    onStart?.();

    let currentAngle = getCurrentAngle();
    const center = getCenter();
    let prevRawAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentCenter = getCenter();
      const rawAngle = Math.atan2(
        moveEvent.clientY - currentCenter.y,
        moveEvent.clientX - currentCenter.x
      );

      let delta = rawAngle - prevRawAngle;
      // Handle angle wraparound
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      currentAngle += delta;
      prevRawAngle = rawAngle;

      onRotate(currentAngle);
    };

    const handleMouseUp = () => {
      // Normalize angle to [-PI, PI]
      const normalized = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle));
      onEnd?.(normalized);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };
}
