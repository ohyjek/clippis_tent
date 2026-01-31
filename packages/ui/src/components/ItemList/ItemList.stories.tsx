/**
 * ItemList.stories.tsx - Storybook stories for ItemList
 */
import { createSignal } from "solid-js";
import { ItemList } from "./ItemList";

export default {
  title: "Components/ItemList",
  component: ItemList,
};

const DEMO_ITEMS = [
  { id: "1", label: "A4 (440 Hz)", color: "#ef4444", icon: "🔊" },
  { id: "2", label: "E4 (330 Hz)", color: "#3b82f6" },
  { id: "3", label: "G4 (392 Hz)", color: "#10b981" },
];

const ROOM_ITEMS = [
  { id: "room-1", label: "Main Room", color: "#8b5cf6" },
  { id: "room-2", label: "Side Area", color: "#f59e0b" },
];

export const Default = () => {
  const [selected, setSelected] = createSignal("1");
  return (
    <div style={{ width: "280px" }}>
      <ItemList
        items={DEMO_ITEMS}
        selected={selected()}
        onSelect={setSelected}
      />
    </div>
  );
};

export const WithoutColors = () => {
  const [selected, setSelected] = createSignal("a");
  const items = [
    { id: "a", label: "Option A" },
    { id: "b", label: "Option B" },
    { id: "c", label: "Option C" },
  ];
  return (
    <div style={{ width: "280px" }}>
      <ItemList items={items} selected={selected()} onSelect={setSelected} />
    </div>
  );
};

export const Empty = () => (
  <div style={{ width: "280px" }}>
    <ItemList
      items={[]}
      onSelect={() => {
        console.log("No items yet. Create one!");
      }}
      emptyText="No items yet. Create one!"
    />
  </div>
);

export const RoomsList = () => {
  const [selected, setSelected] = createSignal<string | null>(null);
  return (
    <div style={{ width: "280px" }}>
      <ItemList
        items={ROOM_ITEMS}
        selected={selected()}
        onSelect={setSelected}
        label="Rooms"
      />
    </div>
  );
};
