"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform, type HTMLMotionProps } from "motion/react";
import { useEffect, useRef } from "react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function Reveal({
  children, delay = 0, y = 28, x = 0, className, once = true, blur = true,
}: { children: React.ReactNode; delay?: number; y?: number; x?: number; className?: string; once?: boolean; blur?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y, x, filter: blur ? "blur(8px)" : "blur(0px)" }}
      whileInView={{ opacity: 1, y: 0, x: 0, filter: "blur(0px)" }}
      viewport={{ once, margin: "-70px" }}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, gap = 0.08, delay = 0 }: { children: React.ReactNode; className?: string; gap?: number; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className, ...rest }: { children: React.ReactNode; className?: string } & Omit<HTMLMotionProps<"div">, "children" | "className">) {
  return (
    <motion.div
      className={className}
      variants={{ hidden: { opacity: 0, y: 30, scale: 0.97 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } } }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** شمارنده‌ی انیمیشنی با ارقام فارسی */
export function CountUp({ to, duration = 1.8, className, suffix = "" }: { to: number; duration?: number; className?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => new Intl.NumberFormat("fa-IR", { maximumFractionDigits: 0 }).format(Math.round(v)) + suffix);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!inView) return;
    if (reduce) { mv.set(to); return; }
    const controls = animate(mv, to, { duration, ease: EASE });
    return () => controls.stop();
  }, [inView, to, duration, mv, reduce]);

  return <motion.span ref={ref} className={className}>{text}</motion.span>;
}

/** انتقال نرم بین صفحات (در template ها استفاده می‌شود) */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 22, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.6, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** کارت با افکت شیب سه‌بعدی ملایم هنگام حرکت ماوس */
export function Tilt({ children, className, max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ref.current.style.transform = `perspective(900px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`;
  };
  const onLeave = () => { if (ref.current) ref.current.style.transform = ""; };
  return (
    <div ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className={className} style={{ transition: "transform .35s cubic-bezier(.22,1,.36,1)", transformStyle: "preserve-3d" }}>
      {children}
    </div>
  );
}
