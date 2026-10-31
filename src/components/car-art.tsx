import { useId } from "react";

/** رنگ‌های بدنه‌ی شیک: [روشن، میانی، تیره] و رنگ پس‌زمینه */
const PAINTS: { body: [string, string, string]; bg: string }[] = [
  { body: ["#ffe29a", "#f0a63a", "#7a4a12"], bg: "#3a2a10" }, // شامپاین طلایی
  { body: ["#ff8f8f", "#d6303f", "#5c0f1a"], bg: "#3a1119" }, // قرمز یاقوتی
  { body: ["#9fb8ff", "#3f63d6", "#13235c"], bg: "#12204a" }, // آبی نیمه‌شب
  { body: ["#f3f6fb", "#aab4c6", "#444d61"], bg: "#1f2636" }, // نقره‌ای
  { body: ["#8ff0cf", "#1fa585", "#0a3f33"], bg: "#0f3029" }, // سبز زمردی
  { body: ["#8e99ad", "#454f63", "#161b27"], bg: "#1a2030" }, // گرافیتی
];

function paintOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return PAINTS[h % PAINTS.length];
}

/** سیلوئت خودرو (SVG). برای نمایش جایگزین وقتی تصویری ثبت نشده یا در هیرو. */
export function CarSilhouette({ paint = PAINTS[0].body, spin = false, className }: { paint?: [string, string, string]; spin?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const [c1, c2, c3] = paint;
  const wheel = (cx: number) => (
    <g transform={`translate(${cx} 184)`}>
      <circle r="40" fill="#05070c" />
      <circle r="40" fill="none" stroke="#1d2434" strokeWidth="3" />
      <g className={spin ? "origin-center animate-wheel" : ""} style={{ transformBox: "fill-box", transformOrigin: "center" }}>
        <circle r="25" fill="#0f1522" stroke="#8b97ad" strokeWidth="2.5" />
        {[0, 72, 144, 216, 288].map((a) => (
          <rect key={a} x="-2.5" y="-22" width="5" height="16" rx="2.5" fill="#c6d0e2" transform={`rotate(${a})`} />
        ))}
        <circle r="5" fill="#c6d0e2" />
      </g>
    </g>
  );
  return (
    <svg viewBox="0 0 620 250" className={className} role="img" aria-label="تصویر خودرو" fill="none">
      <defs>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c1} />
          <stop offset=".55" stopColor={c2} />
          <stop offset="1" stopColor={c3} />
        </linearGradient>
        <linearGradient id={`g${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe3ff" stopOpacity=".95" />
          <stop offset="1" stopColor="#32486b" stopOpacity=".95" />
        </linearGradient>
        <radialGradient id={`l${id}`}><stop offset="0" stopColor="#fff6c9" /><stop offset="1" stopColor="#fff6c9" stopOpacity="0" /></radialGradient>
        <mask id={`m${id}`}>
          <rect width="620" height="250" fill="#fff" />
          <circle cx="150" cy="184" r="50" fill="#000" />
          <circle cx="472" cy="184" r="50" fill="#000" />
        </mask>
      </defs>
      <ellipse cx="310" cy="228" rx="262" ry="13" fill="#000" opacity=".5" />
      <g mask={`url(#m${id})`}>
        <path
          d="M34 176C34 154 52 143 82 139L146 130C170 98 212 74 268 72H366C418 74 458 96 488 128L546 137C574 141 586 154 586 174V190H34Z"
          fill={`url(#b${id})`}
        />
        <path d="M34 176C34 154 52 143 82 139L146 130C170 98 212 74 268 72H366C418 74 458 96 488 128" stroke="#fff" strokeOpacity=".35" strokeWidth="2" />
        <path d="M60 160H560" stroke="#000" strokeOpacity=".22" strokeWidth="2" />
      </g>
      <path d="M186 128C206 100 238 86 272 84H336V128Z" fill={`url(#g${id})`} />
      <path d="M350 84H380C416 88 442 106 460 128H350Z" fill={`url(#g${id})`} />
      <rect x="341" y="86" width="5" height="42" rx="2" fill="#0b1018" opacity=".7" />
      <rect x="298" y="146" width="22" height="5" rx="2.5" fill="#000" opacity=".4" />
      <rect x="402" y="146" width="22" height="5" rx="2.5" fill="#000" opacity=".4" />
      <path d="M552 150H580C584 152 586 158 585 164H552Z" fill="#fff6c9" />
      <circle cx="580" cy="158" r="34" fill={`url(#l${id})`} opacity=".7" />
      <path d="M34 152H46C49 154 50 160 49 166H34Z" fill="#ff4d5e" />
      {wheel(150)}
      {wheel(472)}
    </svg>
  );
}

/** پس‌زمینه‌ی کارت خودرو بدون تصویر */
export function CarArt({ brand, className }: { brand: string; className?: string }) {
  const paint = paintOf(brand);
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden ${className ?? ""}`}
      style={{ background: `radial-gradient(120% 90% at 50% 10%, ${paint.bg} 0%, #0b101b 70%)` }}
    >
      <div className="absolute inset-0 bg-grid opacity-60" />
      <span className="absolute inset-x-0 top-3 text-center text-5xl font-black tracking-tight text-white/[0.05] select-none">{brand}</span>
      <CarSilhouette paint={paint.body} className="relative z-10 max-w-[92%] drop-shadow-[0_18px_28px_rgba(0,0,0,.55)] transition-transform duration-700 group-hover:scale-105 group-hover:-translate-x-1" />
    </div>
  );
}
