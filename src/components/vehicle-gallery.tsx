"use client";

import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Expand } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/format";
import { CarArt } from "./car-art";
import { Modal } from "./ui";

export function VehicleGallery({ images, brand, title }: { images: string[]; brand: string; title: string }) {
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(false);
  const has = images.length > 0;
  const go = (d: number) => setI((x) => (x + d + images.length) % images.length);

  return (
    <div className="space-y-3">
      <div className="group relative aspect-[16/10] overflow-hidden rounded-3xl border border-line bg-surface">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={i} initial={{ opacity: 0, scale: 1.06 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }} className="absolute inset-0">
            {has ? <img src={images[i]} alt={`${title} - تصویر ${i + 1}`} className="size-full object-cover" /> : <CarArt brand={brand} className="size-full" />}
          </motion.div>
        </AnimatePresence>
        {has && (
          <>
            <button onClick={() => setZoom(true)} aria-label="بزرگ‌نمایی" className="absolute end-3 top-3 grid size-10 place-items-center rounded-xl bg-black/50 backdrop-blur-md transition hover:bg-black/70"><Expand className="size-5" /></button>
            {images.length > 1 && (
              <>
                <button onClick={() => go(1)} aria-label="تصویر بعدی" className="absolute start-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-gold hover:text-[#1a1204]"><ChevronLeft className="size-5" /></button>
                <button onClick={() => go(-1)} aria-label="تصویر قبلی" className="absolute end-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 opacity-0 backdrop-blur-md transition group-hover:opacity-100 hover:bg-gold hover:text-[#1a1204]"><ChevronRight className="size-5" /></button>
              </>
            )}
          </>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2.5 overflow-x-auto pb-1">
          {images.map((src, idx) => (
            <button key={src + idx} onClick={() => setI(idx)} aria-label={`نمایش تصویر ${idx + 1}`} className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition-all", idx === i ? "border-gold" : "border-transparent opacity-60 hover:opacity-100")}>
              <img src={src} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
      <Modal open={zoom} onClose={() => setZoom(false)} title={title} wide>
        {has && <img src={images[i]} alt={title} className="w-full rounded-2xl" />}
      </Modal>
    </div>
  );
}
