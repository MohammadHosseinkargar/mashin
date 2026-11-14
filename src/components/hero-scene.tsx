"use client";

import { ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/format";

/** فقط دو رنگ: آبی و مشکی */
const PAINTS = [
  { id: "blue", name: "آبی", src: "/hero-car-blue.webp", body: "/hero-body-blue.webp", wheel: "/hero-wheel-blue", swatch: ["#8fb2ff", "#2f63e8", "#0a1b5c"] },
  { id: "black", name: "مشکی", src: "/hero-car-black.webp", body: "/hero-body-black.webp", wheel: "/hero-wheel-black", swatch: ["#5b6272", "#1a1d26", "#020307"] },
] as const;

/* ------------------------------------------------------------- scenery */

function Palm({ x, y, s = 1, flip = false }: { x: number; y: number; s?: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path d="M0 0 C 5 -42 1 -84 11 -124" fill="none" stroke="#050816" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(11 -124)" fill="#050816">
        {[-168, -138, -108, -76, -44, -12, 18].map((a) => (
          <path key={a} d="M0 0 Q 34 -32 84 4 Q 40 -12 0 0Z" transform={`rotate(${a})`} />
        ))}
      </g>
    </g>
  );
}

function FarLayer() {
  const d = "M0 318V296C60 272 110 258 170 276C230 294 270 244 340 238C410 232 450 278 520 282C600 287 640 250 710 244C780 238 830 278 900 296V318Z";
  return (
    <g className="layer-far">
      <path d={d} fill="#0b1334" />
      <path d={d} fill="#0b1334" transform="translate(900 0)" />
    </g>
  );
}

/* ------------------------------------------------------------------ car */

const CAR_W = 640;
const CAR_H = Math.round((CAR_W * 476) / 1300); // نسبت تصویر
const CAR_X = (900 - CAR_W) / 2;
const GROUND_Y = 354; // پایین لاستیک‌ها
const CAR_Y = GROUND_Y - CAR_H;
const SCALE = CAR_W / 1300;
const WHEEL_R = 91; // شعاع لاستیک در تصویر اصلی (px)
/** مرکز چرخ‌ها در تصویر اصلی ۱۳۰۰×۴۷۶ */
const WHEELS = [
  { id: "rear", cx: 335, cy: 375 },
  { id: "front", cx: 1080, cy: 374 },
] as const;

export function HeroScene({ rate }: { rate: number }) {
  const rawId = useId().replace(/:/g, "");
  const u = (n: string) => `${n}-${rawId}`;
  const [paintIdx, setPaintIdx] = useState(0);
  const stage = useRef<HTMLDivElement>(null);

  // وقتی صحنه دیده نمی‌شود انیمیشن‌ها متوقف می‌شوند (صرفه‌جویی باتری)
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { el.dataset.paused = String(!e.isIntersecting); }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const paint = PAINTS[paintIdx];

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_55%,rgb(47_99_232/.22),transparent_70%)]" />
      <div
        ref={stage} dir="ltr"
        className="hero-scene relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#050a1f] shadow-[0_40px_80px_-30px_rgb(0_0_0/.9)] sm:rounded-[2rem]"
      >
        <svg viewBox="0 0 900 450" className="block h-auto w-full" role="img" aria-label={`خودرو شاسی‌بلند در صحنه‌ی شب، رنگ ${paint.name}`} fill="none">
          <defs>
            <linearGradient id={u("sky")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#040817" /><stop offset=".5" stopColor="#0a1a52" /><stop offset=".85" stopColor="#3a1d78" /><stop offset="1" stopColor="#6b2a8a" />
            </linearGradient>
            <linearGradient id={u("road")} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#0b1a45" /><stop offset=".25" stopColor="#081030" /><stop offset="1" stopColor="#040715" />
            </linearGradient>
            <radialGradient id={u("floor")} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#2aa7ff" stopOpacity=".55" /><stop offset=".6" stopColor="#1d5bff" stopOpacity=".18" /><stop offset="1" stopColor="#1d5bff" stopOpacity="0" />
            </radialGradient>
            <radialGradient id={u("horizon")} cx=".5" cy=".5" r=".5">
              <stop offset="0" stopColor="#4aa8ff" stopOpacity=".45" /><stop offset="1" stopColor="#4aa8ff" stopOpacity="0" />
            </radialGradient>
            <linearGradient id={u("streak")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#7fd0ff" stopOpacity="0" /><stop offset="1" stopColor="#dff4ff" stopOpacity=".95" />
            </linearGradient>
            <linearGradient id={u("beam")} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#bfe9ff" stopOpacity=".55" /><stop offset="1" stopColor="#bfe9ff" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={u("fade")} x1="0" y1={GROUND_Y} x2="0" y2={GROUND_Y + 90} gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <mask id={u("refl")} maskUnits="userSpaceOnUse" x="0" y={GROUND_Y} width="900" height="96">
              <rect x="0" y={GROUND_Y} width="900" height="96" fill={`url(#${u("fade")})`} />
            </mask>
            <pattern id={u("stripe")} width="18" height="18" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
              <rect width="18" height="18" fill="#f6bd4f" /><rect width="9" height="18" fill="#10141f" />
            </pattern>
            <filter id={u("soft")} x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="7" /></filter>
            <filter id={u("glow")} x="-50%" y="-500%" width="200%" height="1100%"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>

          {/* آسمان شب */}
          <rect width="900" height="330" fill={`url(#${u("sky")})`} />
          {Array.from({ length: 30 }).map((_, i) => (
            <circle key={i} cx={(i * 211) % 900} cy={8 + ((i * 97) % 170)} r={i % 5 === 0 ? 1.3 : 0.8} fill="#fff" opacity={0.2 + (i % 4) * 0.1} />
          ))}
          <ellipse cx="450" cy="318" rx="520" ry="90" fill={`url(#${u("horizon")})`} />
          <FarLayer />

          {/* جاده‌ی خیس */}
          <rect y="318" width="900" height="132" fill={`url(#${u("road")})`} />
          <rect y="318" width="900" height="2" fill="#4aa8ff" opacity=".35" />

          {/* خطوط نئون افق */}
          <g className="neon">
            <rect x="0" y="313" width="150" height="5" rx="2.5" fill="#ff2a6d" filter={`url(#${u("glow")})`} />
            <rect x="0" y="314.5" width="120" height="2" rx="1" fill="#ff8fb0" />
            <rect x="750" y="313" width="150" height="5" rx="2.5" fill="#27c8ff" filter={`url(#${u("glow")})`} />
            <rect x="780" y="314.5" width="120" height="2" rx="1" fill="#c9f2ff" />
          </g>

          {/* نخل‌ها */}
          <Palm x={46} y={330} s={1.5} />
          <Palm x={856} y={332} s={1.6} flip />

          {/* خط‌های جاده (در حال حرکت) */}
          <g className="road-run">
            {[0, 900].map((off) => (
              <g key={off} fill="#cfe6ff" transform={`translate(${off} 0)`}>
                {[[60, 80, 0.45], [235, 62, 0.55], [372, 92, 0.5], [560, 96, 0.55], [740, 66, 0.4]].map(([x, w, o]) => (
                  <rect key={x} x={x} y="424" width={w} height="4" rx="2" opacity={o} />
                ))}
              </g>
            ))}
          </g>
          <ellipse cx="450" cy="372" rx="360" ry="34" fill={`url(#${u("floor")})`} />

          {/* خطوط سرعت هنگام ورود */}
          <g>
            {[170, 215, 262, 308, 338].map((y, i) => (
              <rect key={y} className="speed-streak" x="0" y={y} width={260 - (i % 3) * 50} height="2.4" rx="1.2" fill={`url(#${u("streak")})`} style={{ animationDelay: `${i * 0.09}s` }} />
            ))}
          </g>

          {/* ست‌انداز: از راست می‌آید و از زیر چرخ‌ها رد می‌شود */}
          <g className="speed-bump">
            <path d={`M905 ${GROUND_Y - 2} C 925 ${GROUND_Y - 2} 934 ${GROUND_Y - 15} 961 ${GROUND_Y - 15} C 988 ${GROUND_Y - 15} 997 ${GROUND_Y - 2} 1017 ${GROUND_Y - 2} Z`} fill={`url(#${u("stripe")})`} stroke="#05070f" strokeWidth="1.5" />
            <path d={`M905 ${GROUND_Y - 2} C 925 ${GROUND_Y - 2} 934 ${GROUND_Y - 15} 961 ${GROUND_Y - 15} C 988 ${GROUND_Y - 15} 997 ${GROUND_Y - 2} 1017 ${GROUND_Y - 2}`} fill="none" stroke="#fff" strokeOpacity=".35" strokeWidth="1" />
          </g>

          {/* خودرو: ورود → ترمز → نوسان کمک‌ها */}
          <g className="car-drive">
            {/* بازتاب روی جاده */}
            <g mask={`url(#${u("refl")})`}>
              <g transform={`translate(0 ${GROUND_Y * 2}) scale(1 -1)`} opacity=".4">
                <g className="refl-heave">
                  {PAINTS.map((p, i) => (
                    <image key={p.id} href={p.src} x={CAR_X} y={CAR_Y} width={CAR_W} height={CAR_H} className="car-paint" opacity={i === paintIdx ? 1 : 0} preserveAspectRatio="none" />
                  ))}
                </g>
              </g>
            </g>
            <ellipse className="car-shadow" cx="450" cy={GROUND_Y + 2} rx="292" ry="9" fill="#000" filter={`url(#${u("soft")})`} />
            {/* چاه چرخ تاریک (با بدنه حرکت می‌کند) */}
            <g className="car-susp">
              {WHEELS.map((w) => (
                <circle key={w.id} cx={CAR_X + w.cx * SCALE} cy={CAR_Y + w.cy * SCALE} r={WHEEL_R * SCALE + 4} fill="#02040b" />
              ))}
            </g>
            {/* چرخ‌ها: مستقل از بدنه، روی زمین می‌مانند و می‌چرخند */}
            {WHEELS.map((w) => {
              const r = (WHEEL_R + 5) * SCALE;
              return (
                <g key={w.id} transform={`translate(${CAR_X + w.cx * SCALE} ${CAR_Y + w.cy * SCALE})`}>
                  <g className={w.id === "front" ? "hop-front" : "hop-rear"}><g className="wheel-spin">
                    {PAINTS.map((p, i) => (
                      <image key={p.id} href={`${p.wheel}-${w.id}.webp`} x={-r} y={-r} width={r * 2} height={r * 2} className="car-paint" opacity={i === paintIdx ? 1 : 0} />
                    ))}
                  </g></g>
                </g>
              );
            })}
            {/* بدنه روی کمک‌ها: گلگیر روی لاستیک می‌آید و می‌رود */}
            <g className="car-susp">
              <polygon className="lamp" points={`${CAR_X + CAR_W - 24},${CAR_Y + 92} 900,${CAR_Y + 40} 900,${CAR_Y + 150} ${CAR_X + CAR_W - 24},${CAR_Y + 108}`} fill={`url(#${u("beam")})`} />
              {PAINTS.map((p, i) => (
                <image key={p.id} href={p.body} x={CAR_X} y={CAR_Y} width={CAR_W} height={CAR_H} className="car-paint" opacity={i === paintIdx ? 1 : 0} preserveAspectRatio="none" />
              ))}
            </g>
          </g>
        </svg>

        {/* کارت‌های شیشه‌ای */}
        <div dir="rtl" className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
          <div className="glass flex items-center gap-2 rounded-xl px-2.5 py-1.5 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-mint/15 text-mint sm:size-9 sm:rounded-xl"><TrendingUp className="size-4 sm:size-5" /></span>
            <div><p className="text-[10px] text-muted sm:text-[11px]">نرخ در درهم</p><p className="text-xs font-black sm:text-sm">{rate > 0 ? `${toFa(rate)} تومان` : "—"}</p></div>
          </div>
          <div className="glass hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:flex">
            <ShieldCheck className="size-5 text-gold" /><p className="text-xs font-bold">قیمت نهایی شفاف</p>
          </div>
        </div>
      </div>

      {/* انتخاب رنگ: فقط دو دایره، بدون متن */}
      <div className="mt-4 flex items-center justify-center gap-3" role="group" aria-label="انتخاب رنگ خودرو">
        {PAINTS.map((p, i) => (
          <button
            key={p.id} type="button" onClick={() => setPaintIdx(i)} aria-pressed={i === paintIdx} aria-label={p.name}
            className="grid size-10 place-items-center rounded-full"
          >
            <span
              className={cn("block size-6 rounded-full border-2 border-white/20 shadow-inner transition-all duration-300", i === paintIdx && "scale-125 border-white ring-2 ring-gold/70 ring-offset-2 ring-offset-bg")}
              style={{ background: `linear-gradient(135deg, ${p.swatch[0]}, ${p.swatch[1]} 55%, ${p.swatch[2]})` }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
