import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/hp12c-platinum/" : "./",
  define: {"import.meta.env.VITE_DESKTOP_BUILD":JSON.stringify(process.env.TAURI_BUILD === "1" ? "1" : "0")},
  build: {
    outDir: "dist/client",
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.jsx"],
    },
  },
  plugins: [react(), ...(process.env.TAURI_BUILD === "1" ? [] : [VitePWA({
    registerType: "autoUpdate", injectRegister: false,
    includeAssets: ["icons/*.png", "assets/*.png", "models/*.glb"],
    manifest: {
      name: "HP 12c Platinum — Calculadora Financeira", short_name: "12c Platinum", lang: "pt-BR",
      description: "Calculadora financeira independente com motor local e modelo 3D interativo.",
      start_url: "./", scope: "./", display: "standalone", background_color: "#f1f1ec", theme_color: "#f1f1ec",
      icons: [{src:"icons/icon-192.png",sizes:"192x192",type:"image/png"},{src:"icons/hp12c-app-icon.png",sizes:"512x512",type:"image/png",purpose:"any"}],
    },
    workbox: { globPatterns:["**/*.{js,css,html,png,glb,woff2,webmanifest,txt}"], maximumFileSizeToCacheInBytes:15*1024*1024, clientsClaim:true, skipWaiting:true },
  })])],
});
