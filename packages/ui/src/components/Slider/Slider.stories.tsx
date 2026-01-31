/**
 * Slider.stories.tsx - Storybook stories for Slider component
 */
import type { Meta, StoryObj } from "storybook-solidjs";
import { createSignal } from "solid-js";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
  title: "Components/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    showValue: { control: "boolean" },
    disabled: { control: "boolean" },
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
  },
};

export const WithLabel: Story = {
  args: {
    label: "Volume",
    value: 0.75,
    min: 0,
    max: 1,
    step: 0.01,
  },
};

export const WithValue: Story = {
  args: {
    label: "Volume",
    value: 0.5,
    min: 0,
    max: 1,
    step: 0.01,
    showValue: true,
  },
};

export const CustomFormat: Story = {
  args: {
    label: "Gain",
    value: -6,
    min: -20,
    max: 20,
    step: 1,
    showValue: true,
    formatValue: (v: number) => `${v > 0 ? "+" : ""}${v}dB`,
  },
};

export const Disabled: Story = {
  args: {
    label: "Volume",
    value: 0.5,
    showValue: true,
    disabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [volume, setVolume] = createSignal(0.5);
    return (
      <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
        <Slider
          label="Master Volume"
          value={volume()}
          min={0}
          max={1}
          step={0.01}
          showValue
          onInput={(e) => setVolume(parseFloat(e.currentTarget.value))}
        />
        <p style={{ margin: 0, color: "var(--color-text-secondary)", "font-size": "14px" }}>
          Current value: {volume().toFixed(2)}
        </p>
      </div>
    );
  },
};
