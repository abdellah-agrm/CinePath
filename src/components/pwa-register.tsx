"use client";

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    // Register Service Worker silently in background without intrusive popup banners
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("CinePath ServiceWorker registered:", registration.scope);
        })
        .catch((error) => {
          console.warn("ServiceWorker registration failed:", error);
        });
    }
  }, []);

  return null;
}
