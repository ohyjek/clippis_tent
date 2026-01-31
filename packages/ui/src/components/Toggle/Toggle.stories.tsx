/**
 * Toggle.stories.tsx - Storybook stories for Toggle component
 */
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { createSignal } from "solid-js";
import { Toggle } from "./Toggle";

const meta: Meta<typeof Toggle> = {
  title: "Components/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    description: { control: "text" },
    checked: { control: "boolean" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    label: "Enable Feature",
  },
};

export const Checked: Story = {
  args: {
    label: "Spatial Audio",
    checked: true,
  },
};

export const WithDescription: Story = {
  args: {
    label: "Noise Suppression",
    description: "Reduce background noise from your microphone",
  },
};

export const CheckedWithDescription: Story = {
  args: {
    label: "Echo Cancellation",
    description: "Prevent audio feedback loops",
    checked: true,
  },
};

export const Disabled: Story = {
  args: {
    label: "Premium Feature",
    description: "Upgrade to enable this feature",
    disabled: true,
  },
};

export const Interactive: Story = {
  render: () => {
    const [enabled, setEnabled] = createSignal(false);
    return (
      <div>
        <Toggle
          label="Dark Mode"
          description="Enable dark color scheme"
          checked={enabled()}
          onChange={(e) => setEnabled(e.currentTarget.checked)}
        />
        <p style={{
          "margin-top": "16px",
          color: "var(--color-text-secondary)",
          "font-size": "14px",
        }}>
          Dark mode is: <strong style={{ color: "var(--color-text-primary)" }}>
            {enabled() ? "ON" : "OFF"}
          </strong>
        </p>
      </div>
    );
  },
};

export const SettingsList: Story = {
  render: () => (
    <div style={{ display: "flex", "flex-direction": "column", gap: "8px" }}>
      <Toggle
        label="Spatial Audio"
        description="Enable 3D positional audio"
        checked={true}
      />
      <Toggle
        label="Noise Suppression"
        description="Reduce background noise"
        checked={true}
      />
      <Toggle
        label="Echo Cancellation"
        description="Prevent audio feedback"
        checked={false}
      />
      <Toggle
        label="Auto Gain Control"
        description="Automatically adjust microphone volume"
        checked={false}
      />
    </div>
  ),
};
