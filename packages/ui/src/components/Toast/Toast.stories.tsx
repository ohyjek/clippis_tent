/**
 * Toast.stories.tsx - Storybook stories for Toast component
 */
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { createSignal } from "solid-js";
import { ToastContainer, type ToastData } from "./Toast";
import { Button } from "../Button";

const meta: Meta<typeof ToastContainer> = {
  title: "Components/Toast",
  component: ToastContainer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof ToastContainer>;

export const Success: Story = {
  args: {
    toasts: [{ id: "1", type: "success", message: "Settings saved successfully!" }],
    onDismiss: () => undefined,
  },
};

export const Error: Story = {
  args: {
    toasts: [{ id: "1", type: "error", message: "Failed to connect to server" }],
    onDismiss: () => undefined,
  },
};

export const Warning: Story = {
  args: {
    toasts: [{ id: "1", type: "warning", message: "Your session will expire in 5 minutes" }],
    onDismiss: () => undefined,
  },
};

export const Info: Story = {
  args: {
    toasts: [{ id: "1", type: "info", message: "New update available" }],
    onDismiss: () => undefined,
  },
};

export const AllTypes: Story = {
  args: {
    toasts: [
      { id: "1", type: "success", message: "Operation completed" },
      { id: "2", type: "error", message: "Something went wrong" },
      { id: "3", type: "warning", message: "Please review your settings" },
      { id: "4", type: "info", message: "Tip: Use keyboard shortcuts" },
    ],
    onDismiss: () => undefined,
  },
};

export const Interactive: Story = {
  render: () => {
    const [toasts, setToasts] = createSignal<ToastData[]>([]);
    let idCounter = 0;

    const addToast = (type: ToastData["type"], message: string) => {
      const id = String(++idCounter);
      setToasts((prev) => [...prev, { id, type, message }]);
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };

    const dismissToast = (id: string) => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
      <div style={{ padding: "20px" }}>
        <div style={{ display: "flex", gap: "8px", "flex-wrap": "wrap" }}>
          <Button variant="success" onClick={() => addToast("success", "Success!")}>
            Show Success
          </Button>
          <Button variant="danger" onClick={() => addToast("error", "Error occurred!")}>
            Show Error
          </Button>
          <Button variant="purple" onClick={() => addToast("warning", "Warning!")}>
            Show Warning
          </Button>
          <Button variant="primary" onClick={() => addToast("info", "Info message")}>
            Show Info
          </Button>
        </div>
        <ToastContainer toasts={toasts()} onDismiss={dismissToast} />
      </div>
    );
  },
};
