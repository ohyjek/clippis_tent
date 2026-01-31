/**
 * useRoomManager.ts - Room state management hook
 *
 * Provides room CRUD operations and selection state.
 */
import { createSignal, type Accessor, type Setter } from "solid-js";
import type { DrawnRoom, Position, Wall } from "@clippis/types";
import {
  createRoomFromCorners,
  isValidRoomSize,
  updateItemById,
  DEFAULT_ATTENUATION,
} from "@/lib/spatial-utils";

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

/**
 * Hook for managing room state
 */
export function useRoomManager(): RoomManagerState {
  const [rooms, setRooms] = createSignal<DrawnRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);

  const selectedRoom = () => rooms().find((r) => r.id === selectedRoomId());
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);

  const addRoom = (start: Position, end: Position, config: RoomConfig): boolean => {
    if (!isValidRoomSize(start, end)) {
      return false;
    }

    const room = createRoomFromCorners(
      start,
      end,
      config.id,
      config.color,
      config.attenuation ?? DEFAULT_ATTENUATION
    );
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
    setRooms((prev) => updateItemById(prev, id, updates));
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
