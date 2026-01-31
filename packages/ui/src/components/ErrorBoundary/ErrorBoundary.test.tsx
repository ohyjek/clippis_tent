/**
 * ErrorBoundary.test.tsx - Unit tests for ErrorBoundary component
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { ErrorBoundary } from "./ErrorBoundary";

// Component that throws an error
function ThrowError(props: { shouldThrow: boolean }) {
  if (props.shouldThrow) {
    throw new Error("Test error message");
  }
  return <div>No error</div>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error for expected errors
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(vi.fn());
  });

  it("renders children when no error", () => {
    render(() => (
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>
    ));
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders fallback UI when error occurs", () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("displays error message in fallback", () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));
    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("renders Try Again button in fallback", () => {
    render(() => (
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));
    expect(screen.getByRole("button", { name: /try again/i })).toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    const onError = vi.fn();
    render(() => (
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));
    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("uses custom fallback when provided", () => {
    render(() => (
      <ErrorBoundary
        fallback={(err, reset) => (
          <div>
            <span>Custom error: {err.message}</span>
            <button onClick={reset}>Reset</button>
          </div>
        )}
      >
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    ));
    expect(screen.getByText("Custom error: Test error message")).toBeInTheDocument();
  });
});
