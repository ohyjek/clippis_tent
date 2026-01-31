/**
 * Toggle.test.tsx - Unit tests for Toggle component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders label text", () => {
    render(() => <Toggle label="Enable feature" />);
    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("renders as a checkbox input", () => {
    render(() => <Toggle label="Test" />);
    expect(screen.getByRole("checkbox")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(() => <Toggle label="Dark Mode" description="Enable dark color scheme" />);
    expect(screen.getByText("Enable dark color scheme")).toBeInTheDocument();
  });

  it("is checked when checked prop is true", () => {
    render(() => <Toggle label="Test" checked />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("is unchecked when checked prop is false", () => {
    render(() => <Toggle label="Test" checked={false} />);
    expect(screen.getByRole("checkbox")).not.toBeChecked();
  });

  it("calls onChange when toggled", () => {
    const onChange = vi.fn();
    render(() => <Toggle label="Test" onChange={onChange} />);

    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalled();
  });

  it("is disabled when disabled prop is true", () => {
    render(() => <Toggle label="Test" disabled />);
    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("can be clicked via label", () => {
    const onChange = vi.fn();
    render(() => <Toggle label="Click me" onChange={onChange} />);

    // Clicking the label should toggle the checkbox
    fireEvent.click(screen.getByText("Click me"));
    expect(onChange).toHaveBeenCalled();
  });
});
