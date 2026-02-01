/**
 * RoomsListPanel.tsx - Panel listing all rooms
 *
 * Shows each room with its name and color.
 */
import { Panel, ItemList } from "@components/ui";
import { useDemoContext } from "@components/audio/FullDemo/context";

export function RoomsListPanel() {
  const { rooms, selectedRoomId, setSelectedRoomId } = useDemoContext();

  const items = () =>
    rooms().map((room) => ({
      id: room.id,
      label: room.label,
      color: room.color,
    }));

  return (
    <Panel title="Rooms" icon="🚪">
      <ItemList
        items={items()}
        selected={selectedRoomId()}
        onSelect={setSelectedRoomId}
        emptyText="No rooms yet. Draw one!"
        label="Room list"
      />
    </Panel>
  );
}
