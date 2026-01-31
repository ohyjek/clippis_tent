/**
 * Toast.test.tsx - Unit tests for Toast component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { ToastContainer, type ToastData } from "./Toast";

describe("ToastContainer", () => {
  const mockToasts: ToastData[] = [
    { id: "1", type: "success", message: "Success message" },
    { id: "2", type: "error", message: "Error message" },
  ];

  it("renders all toasts", () => {
    render(() => <ToastContainer toasts={mockToasts} onDismiss={vi.fn()} />);
    expect(screen.getByText("Success message")).toBeInTheDocument();
    expect(screen.getByText("Error message")).toBeInTheDocument();
  });

  it("renders toast with role alert", () => {
    render(() => (
      <ToastContainer 
        toasts={[{ id: "1", type: "info", message: "Info" }]} 
        onDismiss={vi.fn()} 
      />
    ));
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("calls onDismiss when dismiss button is clicked", () => {
    const onDismiss = vi.fn();
    render(() => (
      <ToastContainer 
        toasts={[{ id: "toast-1", type: "info", message: "Test" }]} 
        onDismiss={onDismiss} 
      />
    ));
    
    fireEvent.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledWith("toast-1");
  });

  it("renders success icon for success type", () => {
    render(() => (
      <ToastContainer 
        toasts={[{ id: "1", type: "success", message: "Done" }]} 
        onDismiss={vi.fn()} 
      />
    ));
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("renders error icon for error type", () => {
    const { container } = render(() => (
      <ToastContainer 
        toasts={[{ id: "1", type: "error", message: "Failed" }]} 
        onDismiss={vi.fn()} 
      />
    ));
    // The error icon is in a span with class containing "icon"
    const icon = container.querySelector("span[class*='icon']");
    expect(icon?.textContent).toBe("✕");
  });

  it("renders warning icon for warning type", () => {
    render(() => (
      <ToastContainer 
        toasts={[{ id: "1", type: "warning", message: "Caution" }]} 
        onDismiss={vi.fn()} 
      />
    ));
    expect(screen.getByText("⚠")).toBeInTheDocument();
  });

  it("renders info icon for info type", () => {
    render(() => (
      <ToastContainer 
        toasts={[{ id: "1", type: "info", message: "Note" }]} 
        onDismiss={vi.fn()} 
      />
    ));
    expect(screen.getByText("ℹ")).toBeInTheDocument();
  });

  it("renders empty container when no toasts", () => {
    render(() => <ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("applies correct class for toast type", () => {
    render(() => (
      <ToastContainer 
        toasts={[{ id: "1", type: "success", message: "Test" }]} 
        onDismiss={vi.fn()} 
      />
    ));
    const toast = screen.getByRole("alert");
    expect(toast.className).toContain("success");
  });
});
