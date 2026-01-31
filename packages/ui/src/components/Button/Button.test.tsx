/**
 * Button.test.tsx - Unit tests for Button component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children text", () => {
    render(() => <Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("renders as a button element", () => {
    render(() => <Button>Test</Button>);
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(() => <Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("applies primary variant by default", () => {
    render(() => <Button>Primary</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("primary");
  });

  it("applies success variant class", () => {
    render(() => <Button variant="success">Success</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("success");
  });

  it("applies danger variant class", () => {
    render(() => <Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("danger");
  });

  it("applies outline variant class", () => {
    render(() => <Button variant="outline">Outline</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("outline");
  });

  it("applies purple variant class", () => {
    render(() => <Button variant="purple">Purple</Button>);
    const button = screen.getByRole("button");
    expect(button.className).toContain("purple");
  });

  it("renders icon when provided", () => {
    render(() => <Button icon="🔊">With Icon</Button>);
    expect(screen.getByText("🔊")).toBeInTheDocument();
  });

  it("is disabled when disabled prop is true", () => {
    render(() => <Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(() => <Button onClick={onClick} disabled>Disabled</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("passes through additional HTML attributes", () => {
    render(() => <Button data-testid="custom-button" type="submit">Submit</Button>);
    const button = screen.getByTestId("custom-button");
    expect(button).toHaveAttribute("type", "submit");
  });
});
