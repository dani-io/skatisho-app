"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Check if dismissed recently
    const dismissed = localStorage.getItem("pwa-dismissed");
    if (dismissed && Date.now() - parseInt(dismissed) < 7 * 24 * 60 * 60 * 1000) return;

    // iOS detection
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIOS(isIOSDevice);

    if (isIOSDevice) {
      // Show iOS instructions after 3 seconds
      setTimeout(() => setShow(true), 3000);
      return;
    }

    // Android/Desktop: listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShow(false);
    }
    setDeferredPrompt(null);
  }

  function handleDismiss() {
    setShow(false);
    localStorage.setItem("pwa-dismissed", Date.now().toString());
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-lg mx-auto animate-fade-in">
      <div className="bg-white rounded-[var(--radius-card)] shadow-xl border border-surface-container p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 left-3 text-on-surface-muted"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <img src="/icons/logo.svg" alt="" className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-bold text-sm">اسکیتی‌شو رو نصب کن!</h3>
            <p className="text-xs text-on-surface-muted mt-0.5">
              دسترسی سریع‌تر، بدون مرورگر
            </p>
          </div>
        </div>

        {isIOS ? (
          <div className="text-xs text-on-surface-muted bg-surface-dim rounded-xl p-3 leading-relaxed">
            از منوی <strong>Share</strong> (آیکون مربع با فلش) گزینه
            <strong> Add to Home Screen</strong> رو بزنید.
          </div>
        ) : (
          <Button size="full" onClick={handleInstall}>
            <Download className="w-4 h-4 ml-2" />
            نصب اپلیکیشن
          </Button>
        )}
      </div>
    </div>
  );
}
