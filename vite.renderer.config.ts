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

// Helper to create absolute paths
const resolver = (dir: string) => path.resolve(__dirname, dir);

export default defineConfig(({ mode }) => ({
  plugins: [solidPlugin()],
  // Use inline source maps for better debugger support in dev
  css: {
    devSourcemap: true,
  },
  server: {
    sourcemapIgnoreList: false,
  },
  // Force inline source maps in dev for debugger compatibility
  esbuild: {
    sourcemap: mode === "development" ? "inline" : true,
  },
  resolve: {
    alias: {
      // Root src directory
      "@src": resolver("./src"),

      // Main project directories
      "@components": resolver("./src/components"),
      "@lib": resolver("./src/lib"),
      "@locales": resolver("./src/locales"),
      "@pages": resolver("./src/pages"),
      "@assets": resolver("./src/assets"),
      "@hooks": resolver("./src/hooks"),
      "@stores": resolver("./src/stores"),
      "@types": resolver("./src/types"),
      "@utils": resolver("./src/utils"),
      "@styles": resolver("./src/styles"),

      // Workspace packages (resolve to source for HMR)
      "@clippis/ui": resolver("./packages/ui/src"),
      "@clippis/types": resolver("./packages/types/src"),
    },
  },
  build: {
    target: "esnext",
    // Enable minification
    minify: "esbuild",
    sourcemap: true,
    // Chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for framework code
          "solid-vendor": ["solid-js", "solid-js/web", "@solidjs/router"],
          // Workspace chunks for shared dependencies
          workspace: ["@clippis/ui", "@clippis/types"],
        },
      },
    },
  },
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ["solid-js", "@solidjs/router"],
  },
}));
