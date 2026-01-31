/**
 * Storybook preview configuration
 * 
 * Sets up global decorators and parameters for all stories.
 */
import type { Preview } from "storybook-solidjs-vite";

// Import CSS variables used by components
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
  body {
    background: var(--color-bg-primary);
    color: var(--color-text-primary);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 20px;
  }
`;

// Inject CSS variables
const style = document.createElement("style");
style.textContent = cssVars;
document.head.appendChild(style);

const preview: Preview = {
  parameters: {
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#1a1a2e" },
        { name: "light", value: "#ffffff" },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
