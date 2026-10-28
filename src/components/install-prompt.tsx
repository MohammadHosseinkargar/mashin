"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Smartphone, X, Download, TabletSmartphone } from "lucide-react";
import { Button } from "./ui";
import { cn } from "@/lib/format";

type InstallState = "idle" | "supported" | "can-install" | "installing" | "done";

export function InstallPrompt({ className }: { className?: string }) {
  const [state, setState] = useState<InstallState>("idle");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const badge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let reg: ServiceWorkerRegistration | null = null;
    navigator.serviceWorker
      .register("/sw.js?t=2", { scope: "/" })
      .then((r) => { reg = r; return r; })
      .catch(() => {})
      .then(() => {
        // check if already installed as standalone
        if (window.matchMedia("(display-mode: standalone)").matches) {
          setState("done");
          return;
        }
        if ("onbeforeinstallprompt" in window) {
          window.addEventListener("beforeinstallprompt", (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setState("can-install");
          });
        } else {
          setState("supported");
        }
      });
    return () => { if (reg) reg.unregister(); };
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    setState("installing");
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setState(outcome === "accepted" ? "done" : "supported");
  }

  return (      <div className={cn("pointer-events-none", className)}>
      {/* mobile app install banner */}
      <AnimatePresence>
        {state === "can-install" && badge.current && (
          <motion.div
            ref={badge}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto fixed left-1/2 top-4 z-[60] w-[calc(100%-2rem)] -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-surface-2 border border-line-strong px-4 py-3 shadow-2xl shadow-black/40 sm:rounded-2xl sm:max-w-[280px]">
              <div className="grid size-9 place-items-center rounded-xl bg-mint/15 text-mint shrink-0"><Smartphone className="size-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">نصب کنید تا همیشه در دسترس باشد</p>
                <p className="text-xs text-muted">مشروحات بدون اینترنت هم کار می‌کند؛ منوی پایین هم همیشه باز است.</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button size="sm" className="-mr-1" variant="ghost" onClick={() => setState("supported")} aria-label="بستن"><X className="size-4" /></Button>
                <Button size="sm" onClick={install}><Download className="size-4 -scale-x-100" />نصب</Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* fail-safe install button once we know it's supported (desktop + mobile) */}
      {state === "supported" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="pointer-events-auto fixed end-6 bottom-24 z-40 grid size-11 place-items-center rounded-full bg-surface-2 border border-line-strong shadow-lg shadow-black/30 transition hover:border-gold/50 sm:bottom-4"
          aria-label="نصب برنامه روی دستگاه"
          title="نصب برنامه روی دستگاه (PWA)"
        >
          <Button size="sm" className="size-full rounded-full p-0" variant="secondary" aria-label="نصب"><TabletSmartphone className="size-5" /></Button>
        </motion.div>
      )}

      {/* done confirmation dot */}
      {state === "done" && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="pointer-events-none fixed end-6 bottom-24 z-40 grid size-5 place-items-center rounded-full bg-mint text-[#0d121d] shadow-lg shadow-mint/25"
          aria-label="برنامه نصب شد"
        >
          <span className="text-[10px] font-black">✓</span>
        </motion.div>
      )}
    </div>
  );
}
