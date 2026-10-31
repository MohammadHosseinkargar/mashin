"use client";

import { ShieldCheck, TrendingUp } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { toFa } from "@/lib/format";
import { cn } from "@/lib/format";

/** رنگ‌های بدنه: [روشن، میانی، تیره] */
const PAINTS = [
  { id: "gold", name: "شامپاین طلایی", body: ["#ffe6a8", "#e6a236", "#5e3a0c"], swatch: "#e6a236" },
  { id: "blue", name: "آبی نیمه‌شب", body: ["#b4c8ff", "#3f63d6", "#0b1647"], swatch: "#3f63d6" },
  { id: "white", name: "سفید صدفی", body: ["#ffffff", "#d3dae8", "#5d667c"], swatch: "#e3e9f3" },
  { id: "red", name: "قرمز یاقوتی", body: ["#ffa3a3", "#d6303f", "#470a14"], swatch: "#d6303f" },
  { id: "green", name: "سبز زمردی", body: ["#97f3d3", "#1fa585", "#07352b"], swatch: "#1fa585" },
] as const;

/* ---------------------------------------------------------------- scenery */

function Palm({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M0 0 C 5 -42 1 -84 11 -124" fill="none" stroke="#070c1a" strokeWidth="6" strokeLinecap="round" />
      <g transform="translate(11 -124)" fill="#070c1a">
        {[-168, -138, -108, -76, -44, -12, 18].map((a) => (
          <path key={a} d="M0 0 Q 34 -32 84 4 Q 40 -12 0 0Z" transform={`rotate(${a})`} />
        ))}
      </g>
    </g>
  );
}

function Crane({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} stroke="#070c1a" strokeWidth="3" fill="none" strokeLinecap="round">
      <path d="M0 0V-118M14 0V-118M0 -118H14" />
      <path d="M-62 -108H110M-62 -108L7 -146L110 -108M7 -146V-118" />
      <path d="M96 -108V-70" strokeWidth="1.5" />
      <rect x="86" y="-70" width="20" height="12" fill="#070c1a" stroke="none" />
      <g fill="#070c1a" stroke="none"><rect x="-70" y="-14" width="26" height="14" /><rect x="-40" y="-14" width="26" height="14" /><rect x="-55" y="-28" width="26" height="14" /></g>
    </g>
  );
}

function Town({ x, y }: { x: number; y: number }) {
  const blocks: [number, number, number][] = [[0, 44, 52], [50, 30, 74], [84, 52, 46], [140, 34, 64]];
  return (
    <g transform={`translate(${x} ${y})`}>
      {blocks.map(([bx, w, h]) => (
        <g key={bx}>
          <rect x={bx} y={-h} width={w} height={h} fill="#070c1a" />
          {Array.from({ length: Math.floor(h / 16) }).map((_, r) => (
            <rect key={r} x={bx + 7 + ((r * 13) % Math.max(6, w - 18))} y={-h + 8 + r * 16} width="4" height="5" fill="#ffc46b" opacity={r % 2 ? 0.75 : 0.35} />
          ))}
        </g>
      ))}
    </g>
  );
}

function FarLayer() {
  const d = "M0 276V262C60 238 110 226 170 244C230 262 270 214 340 208C410 202 450 246 520 250C600 255 640 220 710 214C780 208 830 246 900 262V276Z";
  return <g className="layer-far"><path d={d} fill="#101a36" /><path d={d} fill="#101a36" transform="translate(900 0)" /></g>;
}

function MidLayer() {
  const strip = (
    <>
      <Palm x={70} y={338} s={0.9} />
      <Town x={170} y={338} />
      <Palm x={392} y={338} s={1.15} />
      <Crane x={520} y={338} />
      <Palm x={690} y={338} s={0.8} />
      <Palm x={742} y={338} s={1.05} />
      <Town x={806} y={338} />
    </>
  );
  return <g className="layer-mid">{strip}<g transform="translate(900 0)">{strip}</g></g>;
}

/* -------------------------------------------------------------------- car */

const BODY = "M86 352C80 340 77 318 80 298C82 284 86 278 96 270C112 262 140 258 172 257C232 252 274 214 332 192C372 175 452 170 502 177C548 183 586 222 612 247C664 258 742 268 790 276C818 282 832 298 832 318C832 336 826 346 812 352Z";
const GLASS = "M198 254H598C586 232 548 196 506 188C455 181 376 181 340 198C290 214 246 238 198 254Z";

function Wheel({ cx, cy, spin, u }: { cx: number; cy: number; spin: boolean; u: (n: string) => string }) {
  return (
    <g transform={`translate(${cx} ${cy})`}>
      {/* تایر */}
      <circle r="54" fill="#0a0c10" />
      <circle r="53" fill="none" stroke="#1b2029" strokeWidth="2" />
      <circle r="47" fill="none" stroke="#161a22" strokeWidth="5" />
      <circle r="43" fill="none" stroke="#232935" strokeWidth="1" strokeDasharray="2 5" opacity=".7" />
      {/* دیسک و کالیپر */}
      <circle r="35" fill={`url(#${u("disc")})`} />
      <circle r="35" fill="none" stroke="#0d1016" strokeWidth="1" strokeDasharray="3 4" opacity=".8" />
      <path d="M-4 -34A34 34 0 0 1 28 -20L20 -14A24 24 0 0 0 0 -25Z" fill="#c92c3b" />
      {/* رینگ */}
      <g className={spin ? "wheel-spin" : undefined}>
        <circle r="37" fill="none" stroke={`url(#${u("rim")})`} strokeWidth="4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <g key={i} transform={`rotate(${i * 72})`}>
            <path d="M-5 -10L-9 -33Q0 -37 9 -33L5 -10Z" fill={`url(#${u("rim")})`} />
            <path d="M-1.2 -13V-31" stroke="#0b0e14" strokeWidth="1.4" opacity=".55" />
          </g>
        ))}
        {Array.from({ length: 5 }).map((_, i) => (<circle key={i} cx="0" cy="-15" r="1.7" fill="#0b0e14" transform={`rotate(${i * 72 + 36})`} />))}
        <circle r="11" fill={`url(#${u("rim")})`} />
        <circle r="5" fill="#10141c" />
      </g>
      {/* محوشدگی حرکتی روی رینگ */}
      {spin && <circle r="36" fill={`url(#${u("blur")})`} opacity=".5" />}
    </g>
  );
}

function CarBody({ u, animated }: { u: (n: string) => string; animated: boolean }) {
  return (
    <>
      <g className={animated ? "car-bob" : undefined}>
        <path d={BODY} fill={`url(#${u("body")})`} />
        <g clipPath={`url(#${u("clip")})`}>
          {/* سایه‌ی زیر بدنه و آستانه */}
          <rect x="70" y="316" width="780" height="40" fill={`url(#${u("rocker")})`} />
          {/* انعکاس افق روی درها */}
          <path d="M120 300L350 262H560L430 306Z" fill={`url(#${u("sheen")})`} />
          <path d="M612 250C660 258 742 268 800 280L800 292C730 280 660 272 606 262Z" fill="#fff" opacity=".16" />
          {/* خط شانه */}
          <path d="M92 276C240 268 420 262 612 262C700 266 770 276 826 292" fill="none" stroke="#fff" strokeOpacity=".4" strokeWidth="1.6" />
          <path d="M92 281C240 273 420 267 612 267C700 271 770 281 826 297" fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="2.4" />
          {/* خط‌های درب */}
          <path d="M402 256L394 350M560 258L556 350M286 262L280 346" fill="none" stroke="#000" strokeOpacity=".55" strokeWidth="1.4" />
          <rect x="454" y="274" width="42" height="5" rx="2.5" fill="#000" opacity=".5" />
          <rect x="454" y="272.5" width="42" height="1.5" rx=".75" fill="#fff" opacity=".35" />
          {/* درخشش سقف */}
          <path d="M340 190C390 172 455 170 502 177" fill="none" stroke="#fff" strokeOpacity=".7" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* شیشه‌ها */}
        <path d={GLASS} fill={`url(#${u("glass")})`} />
        <g clipPath={`url(#${u("glassClip")})`}>
          <path d="M250 260L330 176H376L296 260Z" fill="#fff" opacity=".16" />
          <path d="M440 260L500 176H520L460 260Z" fill="#fff" opacity=".09" />
          <rect x="396" y="170" width="18" height="90" fill="#06080d" transform="skewX(-6)" />
        </g>
        <path d={GLASS} fill="none" stroke="#06080d" strokeWidth="3" />
        {/* آینه */}
        <path d="M596 246C606 240 622 242 626 248C618 254 604 255 596 252Z" fill={`url(#${u("body")})`} stroke="#000" strokeOpacity=".5" strokeWidth="1" />
        {/* چراغ جلو */}
        <path d="M730 272L820 292L822 304L742 288Z" fill="#06080d" />
        <path d="M736 274L812 291L813 297L742 283Z" fill="#eaf7ff" />
        <path d="M744 286L814 301" stroke="#bfe7ff" strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="815" cy="296" r="15" fill={`url(#${u("flare")})`} className={animated ? "beam" : undefined} />
        {/* دهانه‌ی هوا و اسپلیتر */}
        <path d="M770 318L828 324L824 346L778 346Z" fill="#06080d" />
        {[326, 332, 338].map((y) => (<path key={y} d={`M778 ${y}L826 ${y + 2}`} stroke="#262d3b" strokeWidth="1.4" />))}
        <path d="M640 350H816" stroke="#06080d" strokeWidth="5" strokeLinecap="round" />
        {/* چراغ عقب */}
        <path d="M82 286L156 270L158 278L86 296Z" fill="#ff2a3d" />
        <path d="M84 289L152 274" stroke="#ffd0d5" strokeWidth="1.4" opacity=".8" />
        <circle cx="86" cy="288" r="16" fill={`url(#${u("tail")})`} />
      </g>

      {/* کمان چرخ‌ها */}
      <g clipPath={`url(#${u("clip")})`}>
        <circle cx="250" cy="326" r="63" fill="#05070a" />
        <circle cx="655" cy="326" r="63" fill="#05070a" />
        <circle cx="250" cy="326" r="63" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="3" />
        <circle cx="655" cy="326" r="63" fill="none" stroke="#000" strokeOpacity=".6" strokeWidth="3" />
      </g>
      <Wheel cx={250} cy={326} spin={animated} u={u} />
      <Wheel cx={655} cy={326} spin={animated} u={u} />
    </>
  );
}

function Defs({ u }: { u: (n: string) => string }) {
  return (
    <defs>
      <linearGradient id={u("sky")} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#060a18" /><stop offset=".45" stopColor="#1b1f4a" /><stop offset=".78" stopColor="#7a3a57" /><stop offset="1" stopColor="#f0975a" />
      </linearGradient>
      <radialGradient id={u("sun")}><stop offset="0" stopColor="#fff0c4" /><stop offset=".25" stopColor="#ffc46b" /><stop offset=".6" stopColor="#ff8f3f" stopOpacity=".35" /><stop offset="1" stopColor="#ff8f3f" stopOpacity="0" /></radialGradient>
      <linearGradient id={u("sea")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a2d58" /><stop offset="1" stopColor="#0b1126" /></linearGradient>
      <linearGradient id={u("road")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#141a29" /><stop offset=".35" stopColor="#0c111c" /><stop offset="1" stopColor="#070a12" /></linearGradient>
      <linearGradient id={u("body")} x1="0" y1="170" x2="0" y2="352" gradientUnits="userSpaceOnUse">
        <stop offset="0" style={{ stopColor: "var(--paint-1)" }} /><stop offset=".5" style={{ stopColor: "var(--paint-2)" }} /><stop offset="1" style={{ stopColor: "var(--paint-3)" }} />
      </linearGradient>
      <linearGradient id={u("glass")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8aa0c8" /><stop offset=".4" stopColor="#25345a" /><stop offset="1" stopColor="#080b14" /></linearGradient>
      <linearGradient id={u("rocker")} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity=".7" /></linearGradient>
      <linearGradient id={u("sheen")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".28" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <linearGradient id={u("rim")} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#f6f8fc" /><stop offset=".5" stopColor="#8e98ac" /><stop offset="1" stopColor="#3a4254" /></linearGradient>
      <radialGradient id={u("disc")}><stop offset="0" stopColor="#4a5163" /><stop offset="1" stopColor="#1d222d" /></radialGradient>
      <radialGradient id={u("blur")}><stop offset=".35" stopColor="#0a0c10" stopOpacity="0" /><stop offset="1" stopColor="#0a0c10" stopOpacity=".75" /></radialGradient>
      <radialGradient id={u("flare")}><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#bfe7ff" stopOpacity="0" /></radialGradient>
      <radialGradient id={u("tail")}><stop offset="0" stopColor="#ff3045" stopOpacity=".8" /><stop offset="1" stopColor="#ff3045" stopOpacity="0" /></radialGradient>
      <linearGradient id={u("beam")} x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#fff4d0" stopOpacity=".5" /><stop offset="1" stopColor="#fff4d0" stopOpacity="0" /></linearGradient>
      <linearGradient id={u("fade")} x1="0" y1="380" x2="0" y2="470" gradientUnits="userSpaceOnUse"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></linearGradient>
      <mask id={u("refl")} maskUnits="userSpaceOnUse" x="0" y="380" width="900" height="90"><rect x="0" y="380" width="900" height="90" fill={`url(#${u("fade")})`} /></mask>
      <clipPath id={u("clip")}><path d={BODY} /></clipPath>
      <clipPath id={u("glassClip")}><path d={GLASS} /></clipPath>
      <filter id={u("soft")} x="-20%" y="-300%" width="140%" height="700%"><feGaussianBlur stdDeviation="7" /></filter>
    </defs>
  );
}

/* ------------------------------------------------------------------ scene */

export function HeroScene({ rate }: { rate: number }) {
  const rawId = useId().replace(/:/g, "");
  const u = (n: string) => `${n}-${rawId}`;
  const [paintIdx, setPaintIdx] = useState(0);
  const paint = PAINTS[paintIdx];
  const stage = useRef<HTMLDivElement>(null);

  // وقتی صحنه از دید خارج می‌شود انیمیشن‌ها متوقف می‌شوند (صرفه‌جویی در باتری موبایل)
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { el.dataset.paused = String(!e.isIntersecting); }, { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const vars = { "--paint-1": paint.body[0], "--paint-2": paint.body[1], "--paint-3": paint.body[2] } as React.CSSProperties;

  return (
    <div className="relative mx-auto w-full max-w-[680px]">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[radial-gradient(60%_60%_at_50%_55%,rgb(246_189_79/.16),transparent_70%)]" />
      <div
        ref={stage} style={vars} dir="ltr"
        className="hero-scene relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#060a18] shadow-[0_40px_80px_-30px_rgb(0_0_0/.9)] sm:rounded-[2rem]"
      >
        <svg viewBox="0 0 900 460" className="block h-auto w-full" role="img" aria-label={`خودروی اسپورت با رنگ ${paint.name} در حال حرکت در جاده‌ی ساحلی`} fill="none">
          <Defs u={u} />
          {/* آسمان غروب و خورشید */}
          <rect width="900" height="300" fill={`url(#${u("sky")})`} />
          {Array.from({ length: 26 }).map((_, i) => (<circle key={i} cx={(i * 211) % 900} cy={10 + ((i * 97) % 150)} r={i % 5 === 0 ? 1.3 : 0.8} fill="#fff" opacity={0.25 + (i % 4) * 0.12} />))}
          <circle cx="640" cy="262" r="120" fill={`url(#${u("sun")})`} />
          <circle cx="640" cy="262" r="46" fill="#ffe6a8" opacity=".95" />
          <FarLayer />
          <rect y="262" width="900" height="38" fill={`url(#${u("sea")})`} opacity=".92" />
          <path d="M600 272H680M612 280H668M622 288H658" stroke="#ffc46b" strokeOpacity=".45" strokeWidth="2" strokeLinecap="round" />
          <MidLayer />
          {/* جاده */}
          <rect y="338" width="900" height="122" fill={`url(#${u("road")})`} />
          <rect y="338" width="900" height="3" fill="#fff" opacity=".14" />
          <g className="layer-road"><g fill="#fff" opacity=".5">{Array.from({ length: 8 }).map((_, i) => (<rect key={i} x={i * 160} y="428" width="92" height="5" rx="2" />))}</g></g>

          {/* خودرو (ورود از چپ) */}
          <g className="car-drive">
            <g mask={`url(#${u("refl")})`}><g transform="translate(0 760) scale(1 -1)" opacity=".32"><CarBody u={u} animated={false} /></g></g>
            <ellipse cx="452" cy="382" rx="392" ry="13" fill="#000" opacity=".75" filter={`url(#${u("soft")})`} />
            <polygon points="826,298 900,262 900,368 826,326" fill={`url(#${u("beam")})`} className="beam" />
            <CarBody u={u} animated />
          </g>
          <rect width="900" height="460" fill="none" />
        </svg>

        {/* چیپ‌های اطلاعات */}
        <div dir="rtl" className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
          <div className="glass flex items-center gap-2 rounded-xl px-2.5 py-1.5 sm:gap-3 sm:rounded-2xl sm:px-3.5 sm:py-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-mint/15 text-mint sm:size-9 sm:rounded-xl"><TrendingUp className="size-4 sm:size-5" /></span>
            <div><p className="text-[10px] text-muted sm:text-[11px]">نرخ هر درهم</p><p className="text-xs font-black sm:text-sm">{rate > 0 ? `${toFa(rate)} تومان` : "—"}</p></div>
          </div>
          <div className="glass hidden items-center gap-2 rounded-2xl px-3.5 py-2.5 sm:flex">
            <ShieldCheck className="size-5 text-gold" /><p className="text-xs font-bold">قیمت نهایی شفاف</p>
          </div>
        </div>
      </div>

      {/* انتخاب رنگ بدنه */}
      <div className="mt-4 flex items-center justify-center gap-3" role="group" aria-label="رنگ بدنه">
        {PAINTS.map((p, i) => (
          <button
            key={p.id} type="button" onClick={() => setPaintIdx(i)} aria-pressed={i === paintIdx} aria-label={p.name} title={p.name}
            className="grid size-10 place-items-center rounded-full"
          >
            <span className={cn("block size-6 rounded-full border-2 border-white/20 shadow-inner transition-all duration-300", i === paintIdx && "scale-125 border-white ring-2 ring-gold/70 ring-offset-2 ring-offset-bg")} style={{ background: `linear-gradient(135deg, ${p.body[0]}, ${p.swatch} 55%, ${p.body[2]})` }} />
          </button>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-muted" aria-live="polite">{paint.name}</p>
    </div>
  );
}
