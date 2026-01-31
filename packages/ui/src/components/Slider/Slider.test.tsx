/**
 * Slider.test.tsx - Unit tests for Slider component
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Slider } from "./Slider";

describe("Slider", () => {
  it("renders as a range input", () => {
    render(() => <Slider />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    render(() => <Slider label="Volume" />);
    expect(screen.getByText("Volume")).toBeInTheDocument();
  });

  it("shows value when showValue is true", () => {
    render(() => <Slider value={0.5} showValue />);
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  it("uses custom formatValue function", () => {
    render(() => (
      <Slider 
        value={75} 
        showValue 
        formatValue={(v) => `${v}dB`} 
      />
    ));
    expect(screen.getByText("75dB")).toBeInTheDocument();
  });

  it("calls onInput when value changes", () => {
    const onInput = vi.fn();
    render(() => <Slider onInput={onInput} />);
    
    const slider = screen.getByRole("slider");
    fireEvent.input(slider, { target: { value: "0.7" } });
    
    expect(onInput).toHaveBeenCalled();
  });

  it("applies min and max props", () => {
    render(() => <Slider min={0} max={100} />);
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.min).toBe("0");
    expect(slider.max).toBe("100");
  });

  it("applies step prop", () => {
    render(() => <Slider step={0.1} />);
    const slider = screen.getByRole("slider") as HTMLInputElement;
    expect(slider.step).toBe("0.1");
  });

  it("is disabled when disabled prop is true", () => {
    render(() => <Slider disabled />);
    expect(screen.getByRole("slider")).toBeDisabled();
  });

  it("shows 0% for undefined value with showValue", () => {
    render(() => <Slider showValue />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
