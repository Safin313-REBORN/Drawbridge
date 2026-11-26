import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "react-vendor";
          }
          if (id.includes("node_modules/zod") || id.includes("node_modules/yaml")) {
            return "policy-vendor";
          }
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@drawbridge/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@drawbridge/sdk": path.resolve(__dirname, "../../packages/sdk/src/index.ts"),
      "@drawbridge/attacks": path.resolve(__dirname, "../../packages/attacks/src/index.ts"),
      "@drawbridge/demo-agent": path.resolve(__dirname, "../../apps/demo-agent/src/index.ts"),
    },
  },
});
