import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { ownerSessionPlugin } from "./vite/owner-session";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    // Single-owner private mode (ADR-008): el servidor local solo escucha
    // en loopback. Exponerlo a la red desactiva LOCAL_PRIVATE (fail closed).
    host: "127.0.0.1",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  // Nunca ampliar: solo las variables VITE_* llegan al navegador. Las
  // credenciales del owner (VELARIX_OWNER_*) deben quedarse server-side.
  envPrefix: "VITE_",
  plugins: [react(), ownerSessionPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
