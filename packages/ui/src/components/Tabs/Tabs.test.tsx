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

  it("renders tabs as buttons", () => {
    render(() => <Tabs tabs={tabs} activeTab="tab1" onTabChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
  });

  it("applies active class to active tab", () => {
    render(() => <Tabs tabs={tabs} activeTab="tab2" onTabChange={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons[1].className).toContain("active");
    expect(buttons[0].className).not.toContain("active");
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

  it("highlights the correct active tab", () => {
    // Test with tab2 active
    render(() => (
      <Tabs tabs={tabs} activeTab="tab2" onTabChange={vi.fn()} />
    ));
    
    const buttons = screen.getAllByRole("button");
    expect(buttons[1].className).toContain("active");
    expect(buttons[0].className).not.toContain("active");
    expect(buttons[2].className).not.toContain("active");
  });
});
