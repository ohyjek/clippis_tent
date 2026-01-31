/**
 * Section.stories.tsx - Storybook stories for Section component
 */
import type { Meta, StoryObj } from "storybook-solidjs";
import { Section } from "./Section";

const meta: Meta<typeof Section> = {
  title: "Components/Section",
  component: Section,
  tags: ["autodocs"],
  argTypes: {
    title: { control: "text" },
  },
};

export default meta;
type Story = StoryObj<typeof Section>;

export const Default: Story = {
  args: {
    title: "Audio Settings",
    children: (
      <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
        Configure your audio preferences here.
      </p>
    ),
  },
};

export const WithForm: Story = {
  args: {
    title: "User Profile",
    children: (
      <div style={{ display: "flex", "flex-direction": "column", gap: "12px" }}>
        <label style={{ color: "var(--color-text-secondary)", "font-size": "14px" }}>
          Display Name
          <input
            type="text"
            placeholder="Enter your name"
            style={{
              display: "block",
              "margin-top": "4px",
              padding: "8px",
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              "border-radius": "6px",
              color: "var(--color-text-primary)",
              width: "100%",
            }}
          />
        </label>
      </div>
    ),
  },
};

export const MultipleSections: Story = {
  render: () => (
    <div style={{ display: "flex", "flex-direction": "column", gap: "16px" }}>
      <Section title="General">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          General application settings.
        </p>
      </Section>
      <Section title="Audio">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Audio device configuration.
        </p>
      </Section>
      <Section title="Advanced">
        <p style={{ margin: 0, color: "var(--color-text-secondary)" }}>
          Advanced options for power users.
        </p>
      </Section>
    </div>
  ),
};
