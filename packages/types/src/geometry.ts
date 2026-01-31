/**
 * 2D position in space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * A wall defined by start and end points
 */
export interface Wall {
  start: Position;
  end: Position;
}

/**
 * Bounding box for rectangular regions
 */
export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
