import { build } from "vite";
process.env.TAURI_BUILD = "1";
await build();
