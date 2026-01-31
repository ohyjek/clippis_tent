/**
 * Storybook main configuration for @clippis/ui
 *
 * Note: As of Storybook 10, addon-essentials is built into core.
 * No separate addon packages are needed.
 */
import type { StorybookConfig } from "storybook-solidjs-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx)"],
  framework: {
    name: "storybook-solidjs-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
};

export default config;
