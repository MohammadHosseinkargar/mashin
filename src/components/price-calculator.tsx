"use client";

import { AnimatePresence, motion } from "motion/react";
import { Calculator, Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { ImportFee } from "@/lib/types";
import { calcPrice } from "@/lib/pricing";
import { formatToman, parseNum, toFa } from "@/lib/format";
import { Input } from "./ui";
import { CountUp } from "./motion";

export function PriceCalculator({ rate, fees }: { rate: number; fees: ImportFee[] }) {
  const [raw, setRaw] = useState("120000");
  const aed = parseNum(raw);
  const price = useMemo(() => calcPrice(aed, rate, fees), [aed, rate, fees]);

  return (
    <div className="glass relative overflow-hidden rounded-[2rem] p-6 sm:p-10">
      <div className="pointer-events-none absolute -top-24 start-1/2 size-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="relative grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-gold/15 text-gold"><Calculator className="size-6" /></span>
            <div>
              <h3 className="text-xl font-black">ماشین‌حساب قیمت نهایی</h3>
              <p className="text-sm text-muted">قیمت درهمی خودرو را وارد کنید</p>
            </div>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-muted">قیمت خودرو در امارات (درهم)</span>
            <Input inputMode="numeric" dir="ltr" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="مثلاً 120000" className="h-14 text-center text-xl font-bold tracking-wide" />
          </label>
          <input
            type="range" min={10000} max={600000} step={5000} value={Math.min(Math.max(aed, 10000), 600000)}
            onChange={(e) => setRaw(e.target.value)} aria-label="انتخاب قیمت با لغزنده"
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-3 accent-gold"
          />
          <div className="flex items-start gap-2 rounded-xl bg-white/4 p-3 text-xs leading-6 text-muted">
            <Info className="mt-0.5 size-4 shrink-0 text-gold" />
            نرخ هر درهم: <b className="text-ink">{rate > 0 ? formatToman(rate) : "هنوز تنظیم نشده"}</b>. مبلغ نهایی تخمینی است و ممکن است با نرخ روز تغییر کند.
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3 text-sm">
            <span className="text-muted">معادل تومانی خودرو</span>
            <span className="font-bold">{formatToman(price.baseToman)}</span>
          </div>
          <AnimatePresence initial={false}>
            {price.lines.map((l) => (
              <motion.div key={l.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3 text-sm">
                  <span className="text-muted">{l.name}{l.type === "percentage" && <span className="ms-1.5 text-xs text-faint">({toFa(l.rawValue)}٪)</span>}</span>
                  <span className="font-semibold">{formatToman(l.amountToman)}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="rounded-2xl border border-gold/30 bg-gradient-to-l from-gold/15 to-transparent p-5">
            <p className="text-sm text-muted">قیمت نهایی تخمینی</p>
            <p className="mt-1 text-3xl font-black gradient-text sm:text-4xl">
              <CountUp key={price.totalToman} to={price.totalToman} duration={0.9} /> <span className="text-lg">تومان</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
