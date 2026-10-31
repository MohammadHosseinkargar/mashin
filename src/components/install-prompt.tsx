"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Download, Smartphone, X } from "lucide-react";
import { Button } from "./ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";

/** ثبت service worker (فقط production) و نمایش بنر نصب وقتی مرورگر واقعاً از نصب پشتیبانی می‌کند. */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return typeof window !== "undefined" && localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
    }
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferred(e as BeforeInstallPromptEvent); };
    const onInstalled = () => setDeferred(null);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    try { await deferred.prompt(); await deferred.userChoice; } catch {}
    setDeferred(null);
  }, [deferred]);

  const show = Boolean(deferred) && !dismissed;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }} transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          role="dialog" aria-label="نصب برنامه"
          className="fixed inset-x-3 z-[60] bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+0.75rem)] md:inset-x-auto md:bottom-6 md:end-6 md:w-80"
        >
          <div className="flex items-center gap-3 rounded-2xl border border-line-strong bg-surface-2/95 p-3 shadow-2xl shadow-black/50 backdrop-blur-xl">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-mint/15 text-mint"><Smartphone className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">نصب برنامه روی گوشی</p>
              <p className="text-xs text-muted">دسترسی سریع‌تر، حتی با اینترنت ضعیف.</p>
            </div>
            <Button size="sm" onClick={install}><Download className="size-4" />نصب</Button>
            <button onClick={dismiss} aria-label="بستن" className="grid size-9 shrink-0 place-items-center rounded-lg text-muted transition hover:bg-white/10 hover:text-ink"><X className="size-4" /></button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
