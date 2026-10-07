import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.jsx";
import "./styles.css";
import {startCacheLifecycle} from './cache-lifecycle.mjs';

if ("serviceWorker" in navigator && import.meta.env.PROD && import.meta.env.VITE_DESKTOP_BUILD !== '1') {
  window.addEventListener("load", () => {const start=()=>startCacheLifecycle(`${import.meta.env.BASE_URL}sw.js`);if(window.requestIdleCallback)window.requestIdleCallback(start,{timeout:2500});else setTimeout(start,1000)},{once:true});
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
