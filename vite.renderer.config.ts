import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

// https://vitejs.dev/config
export default defineConfig({
  plugins: [solidPlugin()],
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
