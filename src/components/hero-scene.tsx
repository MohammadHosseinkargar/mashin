"use client";

import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, TrendingUp, Zap } from "lucide-react";
import { HeroCarArt } from "./hero-car-art";
import { toFa } from "@/lib/format";

export function HeroScene({ rate }: { rate: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto w-full max-w-[640px]" aria-hidden="true">
      <div className="absolute inset-x-0 top-1/2 h-72 -translate-y-1/2 rounded-full bg-gold/20 blur-[90px] animate-pulse-glow" />
      <div className="absolute -start-10 top-0 size-64 rounded-full bg-sky/20 blur-[90px] animate-float-slow" />

      <motion.div
        initial={reduce ? false : { x: 420, opacity: 0, scale: 0.9 }}
        animate={{ x: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
        className="relative z-10"
      >
        <div className="animate-float">
          <HeroCarArt spin className="w-full drop-shadow-[0_30px_50px_rgba(0,0,0,.7)]" />
        </div>
      </motion.div>

      <div className="relative -mt-5 h-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,#000_20%,#000_80%,transparent)]">
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/15" />
        <div className="absolute top-[calc(50%+10px)] flex w-[200%] animate-road gap-[60px]">
          {Array.from({ length: 30 }).map((_, i) => (<span key={i} className="h-[3px] w-[60px] shrink-0 rounded bg-white/25" />))}
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1, duration: 0.8 }} className="glass absolute -top-2 end-0 z-20 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:flex">
        <span className="grid size-10 place-items-center rounded-xl bg-mint/15 text-mint"><TrendingUp className="size-5" /></span>
        <div><p className="text-[11px] text-muted">نرخ هر درهم</p><p className="text-sm font-black">{rate > 0 ? `${toFa(rate)} تومان` : "—"}</p></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.35, duration: 0.8 }} className="glass absolute -bottom-6 start-0 z-20 hidden items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl sm:flex">
        <span className="grid size-10 place-items-center rounded-xl bg-gold/15 text-gold"><ShieldCheck className="size-5" /></span>
        <div><p className="text-[11px] text-muted">قیمت نهایی</p><p className="text-sm font-black">شفاف و بدون هزینه‌ی پنهان</p></div>
      </motion.div>
      <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1.6, type: "spring" }} className="glass absolute end-6 bottom-16 z-20 hidden items-center gap-2 rounded-full px-3 py-2 text-xs font-bold sm:flex">
        <Zap className="size-4 text-gold" />تحویل سریع
      </motion.div>
    </div>
  );
}
