import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@drawbridge/core": path.resolve(__dirname, "../../packages/core/src/index.ts"),
      "@drawbridge/sdk": path.resolve(__dirname, "../../packages/sdk/src/index.ts"),
      "@drawbridge/attacks": path.resolve(__dirname, "../../packages/attacks/src/index.ts"),
      "@drawbridge/demo-agent": path.resolve(__dirname, "../../apps/demo-agent/src/index.ts"),
    },
  },
});
