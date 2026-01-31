/**
 * SelectField.stories.tsx - Storybook stories for SelectField component
 */
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { SelectField } from "./SelectField";

const meta: Meta<typeof SelectField> = {
  title: "Components/SelectField",
  component: SelectField,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof SelectField>;

const audioDevices = [
  { value: "default", label: "System Default" },
  { value: "speakers", label: "Speakers (Realtek)" },
  { value: "headphones", label: "Headphones" },
  { value: "bluetooth", label: "Bluetooth Audio" },
];

export const Default: Story = {
  args: {
    label: "Output Device",
    options: audioDevices,
  },
};

export const WithPlaceholder: Story = {
  args: {
    label: "Select Audio Device",
    options: audioDevices,
    placeholder: "Choose a device...",
  },
};

export const Disabled: Story = {
  args: {
    label: "Output Device",
    options: audioDevices,
    disabled: true,
  },
};

export const WithValue: Story = {
  args: {
    label: "Output Device",
    options: audioDevices,
    value: "headphones",
  },
};

export const MultipleFields: Story = {
  render: () => (
    <div style={{ display: "flex", "flex-direction": "column", gap: "16px", "max-width": "300px" }}>
      <SelectField
        label="Output Device"
        options={audioDevices}
        placeholder="Select output..."
      />
      <SelectField
        label="Input Device"
        options={[
          { value: "default", label: "System Default" },
          { value: "mic", label: "Built-in Microphone" },
          { value: "usb", label: "USB Microphone" },
        ]}
        placeholder="Select input..."
      />
      <SelectField
        label="Sample Rate"
        options={[
          { value: "44100", label: "44.1 kHz" },
          { value: "48000", label: "48 kHz" },
          { value: "96000", label: "96 kHz" },
        ]}
      />
    </div>
  ),
};
