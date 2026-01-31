/**
 * ErrorBoundary.stories.tsx - Storybook stories for ErrorBoundary component
 */
import type { Meta, StoryObj } from "storybook-solidjs-vite";
import { createSignal } from "solid-js";
import { ErrorBoundary } from "./ErrorBoundary";
import { Button } from "../Button";

const meta: Meta<typeof ErrorBoundary> = {
  title: "Components/ErrorBoundary",
  component: ErrorBoundary,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ErrorBoundary>;

// Component that throws an error
function BuggyComponent(props: { shouldThrow: boolean }) {
  if (props.shouldThrow) {
    throw new Error("Something went wrong in the component!");
  }
  return (
    <div style={{
      padding: "20px",
      background: "var(--color-bg-secondary)",
      "border-radius": "8px",
    }}>
      <p style={{ margin: 0, color: "var(--color-text-primary)" }}>
        This component is working correctly.
      </p>
    </div>
  );
}

export const NoError: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyComponent shouldThrow={false} />
    </ErrorBoundary>
  ),
};

export const WithError: Story = {
  render: () => (
    <ErrorBoundary>
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const CustomFallback: Story = {
  render: () => (
    <ErrorBoundary
      fallback={(err, reset) => (
        <div style={{
          padding: "40px",
          "text-align": "center",
          background: "var(--color-bg-secondary)",
          "border-radius": "8px",
          border: "1px solid var(--color-accent-red)",
        }}>
          <div style={{ "font-size": "48px", "margin-bottom": "16px" }}>💥</div>
          <h3 style={{ margin: "0 0 8px", color: "var(--color-text-primary)" }}>
            Oops! Crash detected
          </h3>
          <p style={{
            color: "var(--color-text-secondary)",
            margin: "0 0 16px",
            "font-family": "monospace",
          }}>
            {err.message}
          </p>
          <Button variant="primary" onClick={reset}>
            Retry
          </Button>
        </div>
      )}
    >
      <BuggyComponent shouldThrow={true} />
    </ErrorBoundary>
  ),
};

export const Interactive: Story = {
  render: () => {
    const [shouldThrow, setShouldThrow] = createSignal(false);
    return (
      <div>
        <div style={{ "margin-bottom": "16px" }}>
          <Button
            variant={shouldThrow() ? "success" : "danger"}
            onClick={() => setShouldThrow(!shouldThrow())}
          >
            {shouldThrow() ? "Fix Component" : "Break Component"}
          </Button>
        </div>
        <ErrorBoundary onError={(err) => console.log("Caught:", err.message)}>
          <BuggyComponent shouldThrow={shouldThrow()} />
        </ErrorBoundary>
      </div>
    );
  },
};
