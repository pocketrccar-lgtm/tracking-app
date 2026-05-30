"use client";

// BCH Sourcing OS — PWA install prompt (§10.3)
// - Captures beforeinstallprompt on Android/Chrome → amber banner with Install button.
// - iOS Safari has no beforeinstallprompt → show "Share → Add to Home Screen" hint.
// - Hides entirely when already running as an installed app.
// - Remembers dismissal in localStorage.

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

const DISMISS_KEY = "bch_pwa_dismissed";

// Minimal type for the non-standard beforeinstallprompt event.
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const standaloneMedia =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  // iOS Safari exposes navigator.standalone (not in the standard typings).
  const iosStandalone =
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return standaloneMedia || iosStandalone;
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ reports as Mac but is touch-capable.
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOSDevice || iPadOS;
}

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Already installed, or previously dismissed → render nothing.
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const onInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", onInstalled);

    // iOS never fires beforeinstallprompt → fall back to the manual hint.
    if (isIOS()) {
      setShowIOSHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // localStorage may be unavailable (private mode) — ignore.
    }
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[6.5rem] left-4 right-4 z-30 mx-auto max-w-lg rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/25 p-3 flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
        {showIOSHint ? (
          <Share className="h-5 w-5" aria-hidden />
        ) : (
          <Download className="h-5 w-5" aria-hidden />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight">Install BCH Source</p>
        {showIOSHint ? (
          <p className="mt-0.5 text-xs leading-snug text-white/90">
            Tap Share, then &ldquo;Add to Home Screen&rdquo;.
          </p>
        ) : (
          <p className="mt-0.5 text-xs leading-snug text-white/90">
            Add to your home screen for a faster, full-screen app.
          </p>
        )}
      </div>

      {!showIOSHint && (
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-xl bg-white px-4 min-h-[44px] text-sm font-semibold text-amber-600 active:bg-white/90"
        >
          Install
        </button>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
        className="shrink-0 flex h-11 w-11 items-center justify-center rounded-xl text-white/90 active:bg-white/20"
      >
        <X className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}

export default PwaInstall;
