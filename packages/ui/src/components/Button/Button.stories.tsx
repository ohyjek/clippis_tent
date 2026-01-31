/**
 * Button.stories.tsx - Storybook stories for Button component
 */
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  title: "Components/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "success", "purple", "danger", "outline"],
    },
    icon: { control: "text" },
    disabled: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: "primary",
    children: "Primary Button",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Success Button",
  },
};

export const Danger: Story = {
  args: {
    variant: "danger",
    children: "Delete",
  },
};

export const Purple: Story = {
  args: {
    variant: "purple",
    children: "Purple Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "Outline Button",
  },
};

export const WithIcon: Story = {
  args: {
    variant: "success",
    icon: "🔊",
    children: "Play Sound",
  },
};

export const Disabled: Story = {
  args: {
    variant: "primary",
    children: "Disabled",
    disabled: true,
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="success">Success</Button>
      <Button variant="purple">Purple</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};
