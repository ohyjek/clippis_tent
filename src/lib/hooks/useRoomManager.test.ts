/**
 * useRoomManager.test.ts - Unit tests for room management hook
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createRoot } from "solid-js";
import { useRoomManager, type RoomManagerState } from "@lib/hooks/useRoomManager";

describe("useRoomManager", () => {
  let manager: RoomManagerState;
  let dispose: () => void;

  beforeEach(() => {
    dispose = createRoot((d) => {
      manager = useRoomManager();
      return d;
    });
  });

  afterEach(() => {
    dispose?.();
  });

  describe("initial state", () => {
    it("starts with empty rooms array", () => {
      expect(manager.rooms()).toEqual([]);
    });

    it("starts with no selected room", () => {
      expect(manager.selectedRoomId()).toBeNull();
    });

    it("starts with empty walls array", () => {
      expect(manager.allWalls()).toEqual([]);
    });
  });

  describe("addRoom", () => {
    it("creates a room from two corner positions", () => {
      const start = { x: -1, y: -1 };
      const end = { x: 1, y: 1 };
      const result = manager.addRoom(start, end, { id: "room-1", color: "#ff0000" });

      expect(result).toBe(true);
      expect(manager.rooms().length).toBe(1);
      expect(manager.rooms()[0].id).toBe("room-1");
      expect(manager.rooms()[0].color).toBe("#ff0000");
    });

    it("rejects rooms that are too small", () => {
      const start = { x: 0, y: 0 };
      const end = { x: 0.1, y: 0.1 }; // Less than MIN_ROOM_SIZE (0.2)
      const result = manager.addRoom(start, end, { id: "tiny", color: "#ff0000" });

      expect(result).toBe(false);
      expect(manager.rooms().length).toBe(0);
    });

    it("auto-selects the newly created room", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      expect(manager.selectedRoomId()).toBe("room-1");
    });

    it("creates 4 walls for a rectangular room", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      expect(manager.allWalls().length).toBe(4);
    });

    it("uses default attenuation when not specified", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      expect(manager.rooms()[0].attenuation).toBe(0.5);
    });

    it("uses provided attenuation", () => {
      manager.addRoom(
        { x: -1, y: -1 },
        { x: 1, y: 1 },
        {
          id: "room-1",
          color: "#ff0000",
          attenuation: 0.8,
        }
      );
      expect(manager.rooms()[0].attenuation).toBe(0.8);
    });
  });

  describe("deleteRoom", () => {
    beforeEach(() => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      manager.addRoom({ x: 0, y: 0 }, { x: 2, y: 2 }, { id: "room-2", color: "#00ff00" });
    });

    it("removes a room by ID", () => {
      expect(manager.rooms().length).toBe(2);
      manager.deleteRoom("room-1");
      expect(manager.rooms().length).toBe(1);
      expect(manager.rooms()[0].id).toBe("room-2");
    });

    it("clears selection if deleted room was selected", () => {
      manager.setSelectedRoomId("room-1");
      manager.deleteRoom("room-1");
      expect(manager.selectedRoomId()).toBeNull();
    });

    it("preserves selection if different room was deleted", () => {
      manager.setSelectedRoomId("room-2");
      manager.deleteRoom("room-1");
      expect(manager.selectedRoomId()).toBe("room-2");
    });
  });

  describe("deleteSelectedRoom", () => {
    it("deletes the currently selected room", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      manager.setSelectedRoomId("room-1");
      manager.deleteSelectedRoom();
      expect(manager.rooms().length).toBe(0);
    });

    it("does nothing when no room is selected", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      manager.setSelectedRoomId(null);
      manager.deleteSelectedRoom();
      expect(manager.rooms().length).toBe(1);
    });
  });

  describe("updateRoom", () => {
    beforeEach(() => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
    });

    it("updates room label", () => {
      manager.updateRoom("room-1", { label: "Kitchen" });
      expect(manager.rooms()[0].label).toBe("Kitchen");
    });

    it("updates room color", () => {
      manager.updateRoom("room-1", { color: "#00ff00" });
      expect(manager.rooms()[0].color).toBe("#00ff00");
    });

    it("updates room attenuation", () => {
      manager.updateRoom("room-1", { attenuation: 0.9 });
      expect(manager.rooms()[0].attenuation).toBe(0.9);
    });

    it("can update multiple properties at once", () => {
      manager.updateRoom("room-1", { label: "Office", color: "#0000ff" });
      expect(manager.rooms()[0].label).toBe("Office");
      expect(manager.rooms()[0].color).toBe("#0000ff");
    });
  });

  describe("selectedRoom", () => {
    it("returns undefined when no room is selected", () => {
      expect(manager.selectedRoom()).toBeUndefined();
    });

    it("returns the selected room object", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      manager.setSelectedRoomId("room-1");
      expect(manager.selectedRoom()?.id).toBe("room-1");
    });
  });

  describe("clearRooms", () => {
    it("removes all rooms", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      manager.addRoom({ x: 0, y: 0 }, { x: 2, y: 2 }, { id: "room-2", color: "#00ff00" });
      manager.clearRooms();
      expect(manager.rooms().length).toBe(0);
    });

    it("clears selection", () => {
      manager.addRoom({ x: -1, y: -1 }, { x: 1, y: 1 }, { id: "room-1", color: "#ff0000" });
      manager.setSelectedRoomId("room-1");
      manager.clearRooms();
      expect(manager.selectedRoomId()).toBeNull();
    });
  });

  describe("allWalls", () => {
    it("aggregates walls from all rooms", () => {
      manager.addRoom({ x: -2, y: -2 }, { x: -0.5, y: -0.5 }, { id: "room-1", color: "#ff0000" });
      manager.addRoom({ x: 0.5, y: 0.5 }, { x: 2, y: 2 }, { id: "room-2", color: "#00ff00" });
      expect(manager.allWalls().length).toBe(8); // 4 walls per room
    });
  });
});
