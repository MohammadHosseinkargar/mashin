"use client";

import { motion } from "motion/react";
import { MessageCircle } from "lucide-react";

export function WhatsAppFab({ number, message }: { number: string; message: string }) {
  if (!number) return null;
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  return (
    <motion.a
      href={href} target="_blank" rel="noopener noreferrer" aria-label="گفتگو در واتس‌اپ"
      initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
      className="fixed bottom-5 start-5 z-40 grid size-14 place-items-center rounded-full bg-[#25d366] text-white shadow-[0_10px_34px_-6px_rgb(37_211_102/.7)]"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366]/40 [animation-duration:2.6s]" />
      <MessageCircle className="relative size-7" />
    </motion.a>
  );
}
