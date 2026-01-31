/**
 * Section.test.tsx - Unit tests for Section component
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Section } from "./Section";

describe("Section", () => {
  it("renders title", () => {
    render(() => <Section title="Test Section"><p>Content</p></Section>);
    expect(screen.getByText("Test Section")).toBeInTheDocument();
  });

  it("renders title as h2 element", () => {
    render(() => <Section title="Heading"><p>Content</p></Section>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("Heading");
  });

  it("renders children content", () => {
    render(() => (
      <Section title="Test">
        <p>Child content</p>
      </Section>
    ));
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("renders as section element", () => {
    const { container } = render(() => <Section title="Test"><p>Content</p></Section>);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();
  });

  it("applies section class", () => {
    const { container } = render(() => <Section title="Test"><p>Content</p></Section>);
    const section = container.querySelector("section");
    expect(section?.className).toContain("section");
  });
});
