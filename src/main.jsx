import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import {loadCalculatorWasm} from './wasm-loader.mjs';
import {startCacheLifecycle} from './cache-lifecycle.mjs';

if ("serviceWorker" in navigator && import.meta.env.PROD && import.meta.env.VITE_DESKTOP_BUILD !== '1') {
  startCacheLifecycle(`${import.meta.env.BASE_URL}sw.js`);
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Fetch and compile alongside startup; first render and input retain the local fallback.
if(import.meta.env.VITE_HP12C_ENGINE!=='javascript')loadCalculatorWasm();
else document.documentElement.dataset.calculatorEngine='javascript';
