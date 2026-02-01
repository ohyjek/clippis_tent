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

export default defineConfig({
  plugins: [solidPlugin()],
  resolve: {
    alias: {
      // Root src directory
      "@": resolver("./src"),

      // Main project directories
      "@components": resolver("@/components"),
      "@lib": resolver("@/lib"),
      "@locales": resolver("@/locales"),
      "@pages": resolver("@/pages"),
      "@assets": resolver("@/assets"),
      "@hooks": resolver("@/hooks"),
      "@stores": resolver("@/stores"),
      "@types": resolver("@/types"),
      "@utils": resolver("@/utils"),
      "@styles": resolver("@/styles"),

      // Workspace packages
      "@clippis/ui": resolver("@/packages/ui/src"),
      "@clippis/types": resolver("@/packages/types/src"),
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
});
