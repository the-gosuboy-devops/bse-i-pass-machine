import { defineConfig } from "vite";
import { resolve } from "node:path";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  root: resolve("spa"),
  base: "./",
  publicDir: resolve("spa/public"),
  plugins: [tailwindcss(), viteReact()],
  resolve: {
    alias: { "@": resolve("src") },
  },
  build: {
    outDir: resolve("docs"),
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
