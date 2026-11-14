"use client";

import { AlertTriangle } from "lucide-react";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ImportFee } from "@/lib/types";
import { calcPrice } from "@/lib/pricing";
import { FEE_CURRENCY_LABEL, compactToman, formatAed, formatDate, formatToman, toFa } from "@/lib/format";

export interface LiveRate { rate: number; lastUpdated: string }

const POLL_MS = 20_000;
const RateCtx = createContext<LiveRate>({ rate: 0, lastUpdated: "" });

/** نرخ فعلی درهم؛ با بازه‌ی ۲۰ ثانیه، با برگشتن به تب و با برگشتن اینترنت خودبه‌خود به‌روز می‌شود. */
export function useLiveRate(): LiveRate {
  return useContext(RateCtx);
}

export function RateProvider({ initial, children }: { initial: LiveRate; children: React.ReactNode }) {
  const [live, setLive] = useState<LiveRate>(initial);
  const inFlight = useRef<AbortController | null>(null);

  useEffect(() => {
    async function pull() {
      if (document.visibilityState === "hidden") return;
      inFlight.current?.abort();
      const ctrl = new AbortController();
      inFlight.current = ctrl;
      try {
        const res = await fetch("/api/exchange-rate", { cache: "no-store", signal: ctrl.signal });
        const body = (await res.json()) as { success?: boolean; data?: { rate?: number; lastUpdated?: string } };
        const rate = body.data?.rate;
        if (body.success && typeof rate === "number" && rate > 0) {
          setLive((prev) => (prev.rate === rate ? prev : { rate, lastUpdated: body.data?.lastUpdated ?? prev.lastUpdated }));
        }
      } catch { /* قطعی یا لغو؛ نرخ قبلی می‌ماند و دور بعد دوباره تلاش می‌شود */ }
    }
    pull(); // همان لحظه‌ی ورود، تا نرخ سرور/کش قدیمی هرگز ماندگار نشود
    const timer = setInterval(pull, POLL_MS);
    const onVisible = () => { if (document.visibilityState === "visible") pull(); };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", pull);
    window.addEventListener("focus", pull);
    return () => {
      clearInterval(timer);
      inFlight.current?.abort();
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", pull);
      window.removeEventListener("focus", pull);
    };
  }, []);

  return <RateCtx.Provider value={live}>{children}</RateCtx.Provider>;
}

/** قیمت نهایی داخل کارت خودرو */
export function CardPrice({ aed, fees }: { aed: number; fees: ImportFee[] }) {
  const { rate } = useLiveRate();
  const price = calcPrice(aed, rate, fees);
  return (
    <div>
      <p className="text-[11px] text-faint">برآورد قیمت نهایی در ایران</p>
      <p className="mt-0.5 text-base font-black gradient-text">{rate > 0 ? compactToman(price.totalToman) : "استعلام قیمت"}</p>
      <p className="text-[11px] text-faint">{formatAed(aed)} در امارات</p>
    </div>
  );
}

/** کارت قیمت و ریز هزینه‌ها در صفحه‌ی خودرو */
export function PriceCard({ aed, fees }: { aed: number; fees: ImportFee[] }) {
  const { rate, lastUpdated } = useLiveRate();
  const price = calcPrice(aed, rate, fees);
  const [mountedAt] = useState(() => Date.now());
  const staleDays = lastUpdated ? Math.floor((mountedAt - new Date(lastUpdated).getTime()) / 86_400_000) : 0;
  return (
    <div className="glass relative overflow-hidden rounded-3xl p-6">
      <div className="pointer-events-none absolute -top-16 end-0 size-48 rounded-full bg-gold/20 blur-3xl" />
      <p className="text-sm text-muted">برآورد قیمت نهایی در ایران</p>
      <p className="mt-2 text-2xl font-black gradient-text sm:text-3xl">{rate > 0 ? formatToman(price.totalToman) : "استعلام قیمت"}</p>
      <p className="mt-1 text-sm text-faint">قیمت در امارات: {formatAed(aed)}</p>

      {rate > 0 && (
        <div className="mt-6 space-y-2.5 border-t border-line pt-5 text-sm">
          <div className="flex justify-between gap-3"><span className="text-muted">معادل تومانی ({toFa(rate)} تومان/درهم)</span><span className="shrink-0 font-semibold">{formatToman(price.baseToman)}</span></div>
          {price.lines.map((l) => (
            <div key={l.id} className="flex justify-between gap-3">
              <span className="text-muted">{l.name}<span className="ms-1 text-xs text-faint">{l.type === "percentage" ? `(${toFa(l.rawValue)}٪)` : l.currency !== "Toman" ? `(${toFa(l.rawValue)} ${FEE_CURRENCY_LABEL[l.currency]})` : ""}</span></span>
              <span className="shrink-0 font-semibold">{formatToman(l.amountToman)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-line pt-3 text-base font-black"><span>مجموع</span><span>{formatToman(price.totalToman)}</span></div>
        </div>
      )}
      {lastUpdated && <p className="mt-4 text-xs leading-6 text-faint">آخرین به‌روزرسانی نرخ: {formatDate(lastUpdated)}</p>}
      {staleDays > 7 && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-gold/10 p-3 text-xs leading-6 text-gold"><AlertTriangle className="mt-0.5 size-4 shrink-0" />نرخ ارز {toFa(staleDays)} روز پیش به‌روز شده؛ برای قیمت دقیق با ما تماس بگیرید.</p>
      )}
    </div>
  );
}
