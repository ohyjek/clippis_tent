/**
 * useRoomManager.ts - Room state management hook
 *
 * Provides room CRUD operations and selection state.
 */
import { createSignal, type Accessor, type Setter } from "solid-js";
import type { DrawnRoom, Position, Wall, Bounds } from "@clippis/types";

/** Room creation configuration */
export interface RoomConfig {
  /** Unique room identifier */
  id: string;
  /** Room display color */
  color: string;
  /** Wall attenuation (0-1) */
  attenuation?: number;
}

export interface RoomManagerState {
  /** List of all rooms */
  rooms: Accessor<DrawnRoom[]>;
  setRooms: Setter<DrawnRoom[]>;
  /** Currently selected room ID */
  selectedRoomId: Accessor<string | null>;
  setSelectedRoomId: Setter<string | null>;
  /** Get the currently selected room */
  selectedRoom: () => DrawnRoom | undefined;
  /** All walls from all rooms */
  allWalls: () => Wall[];
  /** Add a room from corner positions */
  addRoom: (start: Position, end: Position, config: RoomConfig) => boolean;
  /** Delete the currently selected room */
  deleteSelectedRoom: () => void;
  /** Delete a room by ID */
  deleteRoom: (id: string) => void;
  /** Update room properties */
  updateRoom: (
    id: string,
    updates: Partial<Pick<DrawnRoom, "label" | "color" | "attenuation">>
  ) => void;
  /** Clear all rooms */
  clearRooms: () => void;
}

/** Minimum room size threshold */
const MIN_ROOM_SIZE = 0.2;
const DEFAULT_ATTENUATION = 0.5;

/**
 * Create walls from rectangular bounds
 */
function createWallsFromBounds(bounds: Bounds): Wall[] {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const left = bounds.x - halfW;
  const right = bounds.x + halfW;
  const top = bounds.y - halfH;
  const bottom = bounds.y + halfH;

  return [
    { start: { x: left, y: top }, end: { x: right, y: top } },
    { start: { x: right, y: top }, end: { x: right, y: bottom } },
    { start: { x: right, y: bottom }, end: { x: left, y: bottom } },
    { start: { x: left, y: bottom }, end: { x: left, y: top } },
  ];
}

/**
 * Create room from two corner positions
 */
function createRoomFromCorners(start: Position, end: Position, config: RoomConfig): DrawnRoom {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  const width = maxX - minX;
  const height = maxY - minY;
  const center = { x: minX + width / 2, y: minY + height / 2 };
  const bounds: Bounds = { x: center.x, y: center.y, width, height };
  const walls = createWallsFromBounds(bounds);

  return {
    id: config.id,
    label: `Room ${config.id.slice(-4)}`,
    bounds,
    walls,
    center,
    color: config.color,
    attenuation: config.attenuation ?? DEFAULT_ATTENUATION,
  };
}

/**
 * Hook for managing room state
 */
export function useRoomManager(): RoomManagerState {
  const [rooms, setRooms] = createSignal<DrawnRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);

  const selectedRoom = () => rooms().find((r) => r.id === selectedRoomId());
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);

  const addRoom = (start: Position, end: Position, config: RoomConfig): boolean => {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width <= MIN_ROOM_SIZE || height <= MIN_ROOM_SIZE) {
      return false;
    }

    const room = createRoomFromCorners(start, end, config);
    setRooms((prev) => [...prev, room]);
    setSelectedRoomId(config.id);
    return true;
  };

  const deleteRoom = (id: string) => {
    setRooms((prev) => prev.filter((r) => r.id !== id));
    if (selectedRoomId() === id) {
      setSelectedRoomId(null);
    }
  };

  const deleteSelectedRoom = () => {
    const id = selectedRoomId();
    if (id) deleteRoom(id);
  };

  const updateRoom = (
    id: string,
    updates: Partial<Pick<DrawnRoom, "label" | "color" | "attenuation">>
  ) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const clearRooms = () => {
    setRooms([]);
    setSelectedRoomId(null);
  };

  return {
    rooms,
    setRooms,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoom,
    allWalls,
    addRoom,
    deleteSelectedRoom,
    deleteRoom,
    updateRoom,
    clearRooms,
  };
}
