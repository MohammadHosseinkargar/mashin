"use client";

import { motion } from "motion/react";

export function HeroCarArt({
  model = "bmw",
  spin = true,
  className = "",
}: {
  model?: "bmw" | "benz";
  spin?: boolean;
  className?: string;
}) {
  const isBmw = model === "bmw";

  // BMW 7 Series - Nightfall M Sport
  // Mercedes S-Class - obsidian black
  const colors = isBmw
    ? {
        bodyStart: "#0a0e17",
        bodyMid: "#1c2333",
        bodyEnd: "#05080e",
        chrome: "#e2e8f0",
        accent: "#3b82f6",
        glow: "rgba(59, 130, 246, 0.4)",
      }
    : {
        bodyStart: "#060606",
        bodyMid: "#121212",
        bodyEnd: "#020202",
        chrome: "#f8fafc",
        accent: "#10b981",
        glow: "rgba(16, 185, 129, 0.4)",
      };

  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full"
      >
        {/* Ambient Glow */}
        <div
          className="absolute inset-x-20 bottom-4 h-20 rounded-full blur-3xl"
          style={{ background: colors.glow }}
        />

        <svg
          viewBox="0 0 800 280"
          className="relative z-10 w-full drop-shadow-[0_40px_60px_rgba(0,0,0,0.95)]"
          role="img"
          aria-label={isBmw ? "BMW 7 Series" : "Mercedes-Benz S-Class"}
          fill="none"
        >
          <defs>
            <linearGradient id="mainBody" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={colors.bodyStart} />
              <stop offset="45%" stopColor={colors.bodyMid} />
              <stop offset="100%" stopColor={colors.bodyEnd} />
            </linearGradient>

            <linearGradient id="roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#1e293b" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.98" />
            </linearGradient>

            <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.9" />
            </linearGradient>

            <radialGradient id="headlightBeam" cx="0%" cy="50%" r="100%">
              <stop offset="0%" stopColor={colors.chrome} stopOpacity="0.85" />
              <stop offset="40%" stopColor={colors.chrome} stopOpacity="0.3" />
              <stop offset="100%" stopColor={colors.chrome} stopOpacity="0" />
            </radialGradient>

            <radialGradient id="tailLight" cx="0%" cy="50%" r="100%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
            </radialGradient>

            <mask id="wheelMask">
              <rect width="800" height="280" fill="#ffffff" />
              <circle cx="186" cy="198" r="54" fill="#000" />
              <circle cx="594" cy="198" r="54" fill="#000" />
            </mask>

            <clipPath id="grilleClip">
              <rect x="640" y="150" width="60" height="40" rx="8" />
            </clipPath>
          </defs>

          {/* Road Shadow */}
          <ellipse
            cx="390"
            cy="252"
            rx="340"
            ry="16"
            fill="#000000"
            opacity="0.75"
          />

          {/* Headlight Beam Projection */}
          <polygon
            points="640,160 800,130 800,240 640,190"
            fill="url(#headlightBeam)"
            className="animate-pulse-slow"
          />

          {/* Rear Tail Light Glow */}
          <ellipse
            cx="48"
            cy="166"
            rx="40"
            ry="20"
            fill="url(#tailLight)"
            opacity="0.3"
          />

          {/* Main Car Body */}
          <g mask="url(#wheelMask)">
            {isBmw ? (
              // BMW 7 Series - distinct kidney grille silhouette
              <path
                d="M 50 190
                   C 44 160 60 146 98 142
                   L 186 134
                   C 220 96 280 74 360 72
                   L 480 72
                   C 560 74 610 98 648 134
                   L 730 144
                   C 762 150 770 164 766 186
                   V 202
                   H 50 Z"
                fill="url(#mainBody)"
              />
            ) : (
              // Mercedes S-Class - sleek, floating silhouette
              <path
                d="M 48 190
                   C 42 162 56 150 86 146
                   L 174 138
                   C 208 106 260 82 340 80
                   L 460 80
                   C 540 82 590 106 628 142
                   L 720 150
                   C 752 156 760 170 756 192
                   V 202
                   H 48 Z"
                fill="url(#mainBody)"
              />
            )}

            {/* Chrome Window Trim */}
            <path
              d={isBmw ? "M 100 150 C 180 142 260 134 360 132 L 480 132 C 560 134 630 142 710 150" : "M 98 146 C 178 138 258 130 360 128 L 460 128 C 560 130 640 138 722 146"}
              stroke="url(#chrome)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Cabin Glass */}
            <path
              d={isBmw ? "M 220 136 C 250 102 290 84 350 82 L 470 82 C 530 84 580 102 620 136 Z" : "M 210 140 C 240 110 280 90 340 88 L 460 88 C 520 90 570 110 610 140 Z"}
              fill="url(#glass)"
            />

            {/* Rear Window Post */}
            <rect
              x={isBmw ? "460" : "450"}
              y="80"
              width="10"
              height="60"
              rx="3"
              fill="#0a0f18"
            />

            {/* Door Sill */}
            <path
              d="M 350 156 L 350 170"
              stroke="#000000"
              strokeOpacity="0.5"
              strokeWidth="4"
            />

            {/* Side Character Line */}
            <path
              d="M 120 170 C 280 168 440 166 620 168"
              stroke="#ffffff"
              strokeOpacity="0.15"
              strokeWidth="3"
            />
          </g>

          {/* Wheels */}
          {(() => {
            const renderWheel = (cx: number) => (
              <g transform={`translate(${cx} 198)`}>
                {/* Tire */}
                <circle r="52" fill="#05070c" />
                <circle r="52" fill="none" stroke="#1d2434" strokeWidth="4" />
                {/* Rim */}
                <g
                  className={spin ? "origin-center animate-wheel" : ""}
                  style={{ transformBox: "fill-box", transformOrigin: "center" }}
                >
                  <circle r="32" fill="#0f1522" stroke="#94a3b8" strokeWidth="3" />
                  {/* 5 Spokes */}
                  {[0, 72, 144, 216, 288].map((angle) => (
                    <g key={angle} transform={`rotate(${angle})`}>
                      <rect x="-4" y="-28" width="4" height="20" rx="2" fill="#e2e8f0" />
                      <rect x="0" y="-28" width="4" height="20" rx="2" fill="#cbd5e1" />
                    </g>
                  ))}
                  <circle r="8" fill="#0f1522" stroke="#e2e8f0" strokeWidth="2" />
                  {/* Brand Center Cap */}
                  <circle r="4" fill={isBmw ? "#3b82f6" : "#10b981"} />
                </g>
              </g>
            );
            return (
              <>
                {renderWheel(186)}
                {renderWheel(594)}
              </>
            );
          })()}

          {/* Grille / Bumper */}
          {isBmw ? (
            // BMW Iconic Kidney Grille
            <g transform="translate(650, 154)">
              <rect
                x="0"
                y="0"
                width="40"
                height="32"
                rx="6"
                fill="#0b0f17"
                stroke="url(#chrome)"
                strokeWidth="2"
              />
              <path d="M 20 4 L 20 28" stroke="url(#chrome)" strokeWidth="1.5" />
            </g>
          ) : (
            // Mercedes Panamericana Grille
            <g transform="translate(648, 150)">
              <rect
                x="0"
                y="0"
                width="50"
                height="40"
                rx="8"
                fill="#0b0f17"
                stroke="url(#chrome)"
                strokeWidth="2"
              />
              {/* Vertical slats */}
              <line x1="10" y1="4" x2="10" y2="36" stroke="url(#chrome)" strokeWidth="1.5" />
              <line x1="20" y1="4" x2="20" y2="36" stroke="url(#chrome)" strokeWidth="1.5" />
              <line x1="30" y1="4" x2="30" y2="36" stroke="url(#chrome)" strokeWidth="1.5" />
              <line x1="40" y1="4" x2="40" y2="36" stroke="url(#chrome)" strokeWidth="1.5" />
            </g>
          )}

          {/* Front Bumper Fogs */}
          <rect
            x={isBmw ? "580" : "575"}
            y="180"
            width="20"
            height="6"
            rx="3"
            fill="#e2e8f0"
            opacity="0.4"
          />
          <rect
            x={isBmw ? "710" : "705"}
            y="180"
            width="20"
            height="6"
            rx="3"
            fill="#e2e8f0"
            opacity="0.4"
          />

          {/* Headlights */}
          <path
            d="M 640 158 L 680 152"
            stroke={colors.chrome}
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="680" cy="152" r="10" fill={colors.chrome} opacity="0.7" />

          {/* Tail Lights */}
          <path
            d="M 46 160 L 60 160"
            stroke="#dc2626"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="60" cy="160" r="3" fill="#ef4444" opacity="0.5" />

          {/* Model Badge */}
          <g transform="translate(390, 126)" opacity="0.8">
            <circle r="8" fill={isBmw ? "#3b82f6" : "#10b981"} />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fontSize="10"
              fontWeight="bold"
              fill="#ffffff"
              style={{ fontFamily: "sans-serif" }}
            >
              {isBmw ? "740" : "S 580"}
            </text>
          </g>
        </svg>

        {/* Model Label */}
        <div className="mt-3 flex items-center justify-center gap-2 text-center text-xs font-semibold text-muted">
          <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1 backdrop-blur-sm">
            <span
              className="size-2.5 rounded-full animate-pulse"
              style={{ background: colors.glow }}
            />
            {isBmw ? "BMW 7 Series" : "Mercedes-Benz S-Class"}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-white/50">
            {isBmw ? "Luxury Sedan • 4.0L Twin-Turbo" : "Flagship Sedan • V8 Biturbo"}
          </span>
        </div>
      </motion.div>
    </div>
  );
}
