"use client";

import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";

export function WhatsAppFab({ number, message }: { number: string; message: string }) {
  if (!number) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return (
    <motion.a
      href={href} target="_blank" rel="noopener noreferrer" aria-label="گفتگو در واتس‌اپ"
      initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
      whileTap={{ scale: 0.92 }}
      className="fixed start-4 z-40 bottom-[calc(var(--nav-h)+env(safe-area-inset-bottom)+1rem)] grid size-13 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-6px_rgb(37_211_102/.65)] md:bottom-6 md:size-14"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366]/35 [animation-duration:2.8s]" />
      <MessageCircle className="relative size-6 md:size-7" />
    </motion.a>
  );
}
