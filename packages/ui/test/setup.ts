/**
 * test/setup.ts - Test setup for @clippis/ui
 *
 * Configures testing environment with jest-dom matchers and
 * provides mock CSS variables for component styling.
 */
import { beforeAll } from "vitest";
import "@testing-library/jest-dom/vitest";

// Mock CSS custom properties used by components
const cssVars = `
  :root {
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 12px;
    --spacing-lg: 16px;
    --spacing-xl: 24px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-full: 9999px;
    --color-bg-primary: #1a1a2e;
    --color-bg-secondary: #16213e;
    --color-bg-tertiary: #0f3460;
    --color-text-primary: #ffffff;
    --color-text-secondary: #94a3b8;
    --color-text-muted: #64748b;
    --color-border: #334155;
    --color-accent-blue: #3b82f6;
    --color-accent-green: #22c55e;
    --color-accent-purple: #8b5cf6;
    --color-accent-red: #ef4444;
    --transition-fast: 0.15s ease;
  }
`;

// Inject CSS variables into the document
beforeAll(() => {
  const style = document.createElement("style");
  style.textContent = cssVars;
  document.head.appendChild(style);
});
