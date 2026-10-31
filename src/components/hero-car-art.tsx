"use client";

import { motion } from "motion/react";

import { useState } from "react";

export function HeroCarArt({
  model: initialModel = "bmw",
  spin = true,
  className = "",
}: {
  model?: "bmw" | "benz";
  spin?: boolean;
  className?: string;
}) {
  const [model, setModel] = useState<"bmw" | "benz">(initialModel);
  const isBmw = model === "bmw";

  // Static prices for display (can be updated to fetch from your exchange rate API if needed)
  const carPrices = {
    bmw: 150000, // BMW i8 approximate price in USD
    benz: 180000, // Mercedes-AMG GT approximate price in USD
  };

  // BMW i8 - Protonic Blue
  // Mercedes-AMG GT - Magma Orange
  const theme = isBmw
    ? {
        body: ["#1a3a5c", "#0f2438", "#061220"],
        accent: "#06b6d4",
        glow: "#22d3ee",
        wheel: "#e0f2fe",
        badge: "#0891b2",
        interior: "#67e8f9",
      }
    : {
        body: ["#5c2a0a", "#3a1a04", "#1d0d02"],
        accent: "#f97316",
        glow: "#fb923c",
        wheel: "#fed7aa",
        badge: "#ea580c",
        interior: "#fdba74",
      };

  const wheel = (cx: number) => (
    <g transform={`translate(${cx} 218)`}>
      {/* Tire */}
      <circle r="48" fill="#030508" />
      <circle r="48" fill="none" stroke="#1f2937" strokeWidth="3" />

      {/* Brake Disc */}
      <circle r="34" fill="#111827" stroke="#374151" strokeWidth="0.5" strokeDasharray="4 6" />

      {/* Caliper */}
      <path d="M -18 -24 A 26 26 0 0 1 14 -26 L 10 -16 A 16 16 0 0 0 -12 -14 Z" fill={theme.badge} />

      {/* Rim */}
      <g className={spin ? "origin-center animate-wheel" : ""} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle r="30" fill="#0a0f18" stroke={theme.wheel} strokeWidth="2" />
        {/* 5 Spokes */}
        {[0, 72, 144, 216, 288].map((a) => (
          <rect key={a} x="-3" y="-26" width="6" height="18" rx="3" fill={theme.wheel} transform={`rotate(${a})`} />
        ))}
        <circle r="8" fill="#0a0f18" stroke={theme.wheel} strokeWidth="1.5" />
        <circle r="3" fill={theme.accent} />
      </g>
    </g>
  );

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      {/* Toggle */}
      <div className="z-20 mb-4 flex rounded-full border border-white/10 bg-surface/90 p-1 backdrop-blur-md">
        <button onClick={() => setModel("bmw")} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${isBmw ? "bg-cyan-500/20 text-cyan-400" : "text-muted hover:text-white"}`}>
          BMW i8
        </button>
        <button onClick={() => setModel("benz")} className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${!isBmw ? "bg-orange-500/20 text-orange-400" : "text-muted hover:text-white"}`}>
          AMG GT
        </button>
      </div>

      <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} className="relative w-full">
        {/* Glow */}
        <motion.div className="absolute inset-x-20 bottom-8 h-24 rounded-full blur-[45px]" style={{ background: theme.glow, opacity: 0.4 }} animate={{ opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 3, repeat: Infinity }} />

        <svg viewBox="0 0 820 280" className="relative z-10 w-full drop-shadow-[0_40px_70px_rgba(0,0,0,0.95)]" role="img" aria-label={isBmw ? "BMW i8" : "Mercedes-AMG GT"} fill="none">
          <defs>
            <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.body[0]} />
              <stop offset="50%" stopColor={theme.body[1]} />
              <stop offset="100%" stopColor={theme.body[2]} />
            </linearGradient>
            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
            </linearGradient>
            <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f8fafc" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#fff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.9" />
            </linearGradient>
            <radialGradient id="beam" cx="0%" cy="50%" r="100%">
              <stop offset="0%" stopColor={theme.glow} stopOpacity="0.9" />
              <stop offset="100%" stopColor={theme.glow} stopOpacity="0" />
            </radialGradient>
            <mask id="wheels">
              <rect width="820" height="280" fill="#fff" />
              <circle cx="190" cy="218" r="52" fill="#000" />
              <circle cx="610" cy="218" r="52" fill="#000" />
            </mask>
          </defs>

          {/* Shadow */}
          <ellipse cx="400" cy="255" rx="350" ry="15" fill="#000" opacity="0.8" />

          {/* Headlight Beam */}
          <motion.polygon points="660,175 820,130 820,250 660,210" fill="url(#beam)" animate={{ opacity: [0.5, 0.8, 0.5] }} transition={{ duration: 2, repeat: Infinity }} />

          {/* Rear Glow */}
          <ellipse cx="35" cy="180" rx="40" ry="20" fill="#ef4444" opacity="0.25" />

          {/* Body */}
          <g mask="url(#wheels)">
            {isBmw ? (
              // BMW i8 - wedge shape, futuristic
              <path d="M 45 215 C 40 180 55 165 90 160 L 175 152 C 210 115 270 90 340 88 L 440 88 C 510 90 565 115 600 152 L 710 164 C 750 172 760 188 755 215 V 230 H 45 Z" fill="url(#body)" />
            ) : (
              // AMG GT - long hood, fastback
              <path d="M 42 218 C 38 180 52 168 85 162 L 170 154 C 205 120 260 95 330 92 L 430 92 C 500 95 555 120 590 158 L 720 168 C 758 176 768 192 763 218 V 230 H 42 Z" fill="url(#body)" />
            )}

            {/* Roof Line */}
            <path d={isBmw ? "M 45 215 C 40 180 55 165 90 160 L 175 152 C 210 115 270 90 340 88 L 440 88 C 510 90 565 115 600 152 L 710 164" : "M 42 218 C 38 180 52 168 85 162 L 170 154 C 205 120 260 95 330 92 L 430 92 C 500 95 555 120 590 158 L 720 168"} stroke="url(#chrome)" strokeWidth="2" />

            {/* Character Line */}
            <path d="M 130 190 C 300 188 500 186 700 190" stroke="#000" strokeOpacity="0.35" strokeWidth="3" />
          </g>

          {/* Glass */}
          <path d={isBmw ? "M 235 148 C 270 115 315 98 365 96 L 435 96 C 490 98 530 115 565 148 Z" : "M 225 152 C 260 120 305 102 355 100 L 425 100 C 480 102 520 120 555 152 Z"} fill="url(#glass)" />

          {/* Rear Pillar */}
          <rect x={isBmw ? "425" : "415"} y="94" width="10" height="58" rx="2" fill="#050810" />

          {/* Door Handle */}
          <rect x="350" y="168" width="26" height="4" rx="2" fill="#000" opacity="0.5" />

          {/* Wheels */}
          {wheel(190)}
          {wheel(610)}

          {/* Grille */}
          {isBmw ? (
            <g transform="translate(620, 166)">
              <rect x="0" y="0" width="48" height="28" rx="6" fill="#030508" stroke={theme.accent} strokeWidth="1.5" />
              <line x1="16" y1="4" x2="16" y2="24" stroke={theme.accent} strokeWidth="1" />
              <line x1="32" y1="4" x2="32" y2="24" stroke={theme.accent} strokeWidth="1" />
            </g>
          ) : (
            <g transform="translate(615, 162)">
              <rect x="0" y="0" width="56" height="34" rx="6" fill="#030508" stroke="url(#chrome)" strokeWidth="1.5" />
              {[10, 20, 30, 40].map((x) => (<line key={x} x1={x} y1="4" x2={x} y2="30" stroke="url(#chrome)" strokeWidth="1" />))}
            </g>
          )}

          {/* Splitter */}
          <path d="M 600 220 L 740 225" stroke="#1f2937" strokeWidth="6" strokeLinecap="round" />
          <path d="M 610 222 L 730 225" stroke={theme.accent} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

          {/* Headlights */}
          <path d="M 640 172 L 700 165" stroke={theme.glow} strokeWidth="4" strokeLinecap="round" />
          <circle cx="705" cy="165" r="8" fill={theme.glow} opacity="0.6" />

          {/* Taillights */}
          <rect x="42" y="178" width="40" height="4" rx="2" fill="#dc2626" />
          <rect x="46" y="180" width="30" height="2" rx="1" fill="#fff" opacity="0.5" />

          {/* Model Badge */}
          <g transform="translate(400, 140)">
            <rect x="-20" y="-8" width="40" height="16" rx="4" fill="#000" opacity="0.65" />
            <text x="0" y="4" textAnchor="middle" fontSize="9" fontWeight="bold" fill={theme.accent} style={{ fontFamily: "sans-serif" }}>{isBmw ? "i8" : "GT"}</text>
          </g>
        </svg>

        {/* Label */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="rounded-full bg-white/5 px-4 py-1.5 backdrop-blur-md border border-white/10">
            <span className="flex items-center gap-2 text-xs font-bold text-white">
              <span className="size-2 rounded-full animate-pulse" style={{ background: theme.accent }} />
              {isBmw ? "BMW i8" : "Mercedes-AMG GT"}
            </span>
          </div>
          <span className="text-white/30">|</span>
          <span className="text-xs text-white/55">{isBmw ? "Hybrid Sports Car" : "V8 Biturbo Coupe"}</span>
          <span className="text-white/30">|</span>
          <span className="text-xs text-white/55">
            ${carPrices[model].toLocaleString("en-US")}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
