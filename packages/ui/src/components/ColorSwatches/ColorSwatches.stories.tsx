/**
 * ColorSwatches.stories.tsx - Storybook stories for ColorSwatches
 */
import { createSignal } from "solid-js";
import { ColorSwatches } from "./ColorSwatches";

export default {
  title: "Components/ColorSwatches",
  component: ColorSwatches,
};

const DEMO_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
] as const;

export const Default = () => {
  const [selected, setSelected] = createSignal(DEMO_COLORS[4]);
  return (
    <ColorSwatches
      colors={DEMO_COLORS}
      selected={selected()}
      onSelect={setSelected}
    />
  );
};

export const Small = () => {
  const [selected, setSelected] = createSignal(DEMO_COLORS[2]);
  return (
    <ColorSwatches
      colors={DEMO_COLORS}
      selected={selected()}
      onSelect={setSelected}
      size="sm"
    />
  );
};

export const Large = () => {
  const [selected, setSelected] = createSignal(DEMO_COLORS[0]);
  return (
    <ColorSwatches
      colors={DEMO_COLORS}
      selected={selected()}
      onSelect={setSelected}
      size="lg"
    />
  );
};

export const NoSelection = () => (
  <ColorSwatches
    colors={DEMO_COLORS}
    onSelect={(c) => console.log("Selected:", c)}
  />
);
