/**
 * Tabs.test.tsx - Unit tests for Tabs component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Tabs } from "./Tabs";

describe("Tabs", () => {
  const tabs = [
    { id: "tab1", label: "Tab 1" },
    { id: "tab2", label: "Tab 2" },
    { id: "tab3", label: "Tab 3", icon: "🎵" },
  ];

  it("renders all tab labels", () => {
    render(() => <Tabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} />);
    expect(screen.getByText("Tab 1")).toBeInTheDocument();
    expect(screen.getByText("Tab 2")).toBeInTheDocument();
    expect(screen.getByText("Tab 3")).toBeInTheDocument();
  });

  it("renders tabs with correct ARIA roles", () => {
    render(() => <Tabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} />);
    // Tabs should have role="tab" for accessibility
    const tabElements = screen.getAllByRole("tab");
    expect(tabElements).toHaveLength(3);
    // Container should have role="tablist"
    expect(screen.getByRole("tablist")).toBeInTheDocument();
  });

  it("applies aria-selected to active tab", () => {
    render(() => <Tabs tabs={tabs} activeTab="tab2" onTabChange={vi.fn()} />);
    const tabElements = screen.getAllByRole("tab");
    expect(tabElements[1]).toHaveAttribute("aria-selected", "true");
    expect(tabElements[0]).toHaveAttribute("aria-selected", "false");
  });

  it("calls onTabChange when tab is clicked", () => {
    const onTabChange = vi.fn();
    render(() => <Tabs tabs={tabs} activeTab="tab1" onTabChange={onTabChange} />);
    
    fireEvent.click(screen.getByText("Tab 2"));
    expect(onTabChange).toHaveBeenCalledWith("tab2");
  });

  it("renders icon when provided", () => {
    render(() => <Tabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} />);
    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("sets correct tabIndex for keyboard navigation", () => {
    render(() => (
      <Tabs tabs={tabs} activeTab="tab2" onTabChange={vi.fn()} />
    ));
    
    const tabElements = screen.getAllByRole("tab");
    // Active tab should have tabIndex 0, others -1
    expect(tabElements[1]).toHaveAttribute("tabindex", "0");
    expect(tabElements[0]).toHaveAttribute("tabindex", "-1");
    expect(tabElements[2]).toHaveAttribute("tabindex", "-1");
  });
});
