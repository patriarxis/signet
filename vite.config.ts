import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vitejs.dev/config/
export default defineConfig({
  // Root base for Vercel (signet.patriarxis.com)
  base: "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
