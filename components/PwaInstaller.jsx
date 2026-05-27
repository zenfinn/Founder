"use client";

import { useEffect, useState } from "react";

export function PwaInstaller() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.warn("Service Worker registration failed:", error);
      });
    }

    function handleBeforeInstallPrompt(event) {
      event.preventDefault();
      setInstallPrompt(event);
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (!visible || !installPrompt) return null;

  async function installApp() {
    installPrompt.prompt();
    await installPrompt.userChoice;
    setVisible(false);
    setInstallPrompt(null);
  }

  return (
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-founder-600 p-4 text-white md:hidden">
      <p className="font-serif text-xl font-bold">Founder installieren</p>
      <p className="mt-1 text-sm text-founder-50">Füge Founder zu deinem Homescreen hinzu.</p>
      <div className="mt-3 flex gap-2">
        <button onClick={installApp} className="rounded-full bg-white px-4 py-2 text-sm font-bold text-founder-600" type="button">
          App installieren
        </button>
        <button onClick={() => setVisible(false)} className="rounded-full border border-white/30 px-4 py-2 text-sm font-bold" type="button">
          Später
        </button>
      </div>
    </div>
  );
}
