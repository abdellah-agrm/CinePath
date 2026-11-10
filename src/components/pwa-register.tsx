"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function PWARegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
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

    // 2. Listen for BeforeInstallPrompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show install banner if not already installed
      if (!window.matchMedia("(display-mode: standalone)").matches) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    try {
      if (!deferredPrompt) return;
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setShowInstallBanner(false);
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("[PWA] Error launching install prompt:", err);
      setShowInstallBanner(false);
    }
  };

  if (!showInstallBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm rounded-2xl border border-primary/40 bg-card/95 p-4 shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white font-bold shadow-md shadow-primary/30">
            CP
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install CinePath App</h4>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Access your QR tickets offline without internet at the cinema
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInstallBanner(false)}
          className="text-muted-foreground hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleInstallClick}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-xs font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/90"
        >
          <Download className="h-3.5 w-3.5" />
          Install App
        </button>
      </div>
    </div>
  );
}

