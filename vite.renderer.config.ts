/**
 * vite.renderer.config.ts - Vite config for the renderer (UI)
 *
 * Builds the SolidJS frontend that runs in the Electron browser window.
 * Configures:
 * - SolidJS JSX transform
 * - @/ path alias to src/
 * - Code splitting (vendor chunk for solid-js)
 * - Dependency pre-bundling
 */
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    // Enable minification
    minify: "esbuild",
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for framework code
          "solid-vendor": ["solid-js", "solid-js/web", "@solidjs/router"],
        },
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ["solid-js", "@solidjs/router"],
  },
});
