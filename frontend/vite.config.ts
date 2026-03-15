import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import FullReload from "vite-plugin-full-reload";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: {
    host: true, // listen on 0.0.0.0 so the dev server is reachable from the host (e.g. in Docker)
  },
  plugins: [
    react(),
    tailwindcss(),
    FullReload(["src/**"], { delay: 50 }),
  ],
});
