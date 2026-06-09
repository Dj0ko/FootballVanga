import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    proxy: {
      "/api": "http://localhost:4100",
      "/health": "http://localhost:4100"
    }
  },
  preview: {
    host: "localhost",
    port: 4173
  }
});
