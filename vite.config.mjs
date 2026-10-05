import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { readFileSync } from 'node:fs';
const appVersion=JSON.parse(readFileSync(new URL('./package.json',import.meta.url),'utf8')).version;
const buildTime=new Date().toISOString();

export default defineConfig({
  base: process.env.GITHUB_PAGES === "1" ? "/hp12c-platinum/" : "./",
  define: {"import.meta.env.VITE_DESKTOP_BUILD":JSON.stringify(process.env.TAURI_BUILD === "1" ? "1" : "0"),"import.meta.env.VITE_APP_VERSION":JSON.stringify(appVersion),"import.meta.env.VITE_BUILD_TIME":JSON.stringify(buildTime)},
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
    registerType: "prompt", injectRegister: false,

    manifest: {
      name: "HP 12c Platinum", short_name: "HP 12c Platinum", lang: "pt-BR",
      description: "Calculadora financeira independente com motor local e interface 2D leve.",
      start_url: "./", scope: "./", display: "fullscreen", display_override:["fullscreen","standalone"], background_color: "#c6c6c6", theme_color: "#c6c6c6",
      icons: [{src:"icons/hp12c-platinum-v2-192.png",sizes:"192x192",type:"image/png",purpose:"any"},{src:"icons/hp12c-platinum-v2-512.png",sizes:"512x512",type:"image/png",purpose:"any"}],
    },
    workbox: { globIgnores:["**/legal/**"], globPatterns:["**/*.{js,css,html}","assets/*-grain*.svg","assets/hp-emblem-hd.png","assets/menu-icons/*.svg","assets/roboto-condensed.woff2","icons/hp12c-platinum-v2-{180,32}.png"], dontCacheBustURLsMatching:/^assets\/index-[A-Za-z0-9_-]+\.(?:js|css)$/, maximumFileSizeToCacheInBytes:2*1024*1024, clientsClaim:true, skipWaiting:false, cleanupOutdatedCaches:true },
  })])],
});
