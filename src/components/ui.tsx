"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, X } from "lucide-react";
import { useEffect, type ComponentProps, type ReactNode } from "react";
import { cn } from "@/lib/format";

/* ---------- Button ---------- */
type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-gradient-to-l from-amber to-gold text-[#1a1204] font-bold shadow-[0_8px_30px_-8px_rgb(246_189_79/.55)] hover:shadow-[0_12px_40px_-8px_rgb(246_189_79/.8)] hover:brightness-110",
  secondary: "bg-surface-3 text-ink hover:bg-[#222d45] border border-line",
  outline: "border border-line-strong text-ink hover:bg-white/5 hover:border-gold/60",
  ghost: "text-muted hover:text-ink hover:bg-white/5",
  danger: "bg-rose/15 text-rose border border-rose/30 hover:bg-rose/25",
};
const SIZES: Record<Size, string> = { sm: "h-9 px-3.5 text-sm gap-1.5", md: "h-11 px-5 text-[15px] gap-2", lg: "h-14 px-8 text-base gap-2.5" };

export function buttonClass(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return cn(
    "relative inline-flex items-center justify-center rounded-xl font-medium whitespace-nowrap select-none transition-all duration-300",
    "active:scale-[.97] disabled:opacity-50 disabled:pointer-events-none",
    VARIANTS[variant], SIZES[size], extra,
  );
}

export function Button({ variant = "primary", size = "md", loading, className, children, disabled, ...rest }: ComponentProps<"button"> & { variant?: Variant; size?: Size; loading?: boolean }) {
  return (
    <button className={buttonClass(variant, size, className)} disabled={disabled || loading} {...rest}>
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({ variant = "primary", size = "md", className, ...rest }: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClass(variant, size, className)} {...rest} />;
}

/* ---------- Form fields ---------- */
const fieldBase =
  "w-full rounded-xl border border-line bg-surface/80 px-4 text-[15px] text-ink placeholder:text-faint transition-all duration-200 hover:border-line-strong focus:border-gold/70 focus:bg-surface focus:outline-none focus:ring-4 focus:ring-gold/10 disabled:opacity-60";

export function Input({ className, ...rest }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-12", className)} {...rest} />;
}
export function Textarea({ className, ...rest }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 py-3 leading-7 resize-y", className)} {...rest} />;
}
export function Select({ className, children, ...rest }: ComponentProps<"select">) {
  return (
    <select className={cn(fieldBase, "select-arrow h-12 cursor-pointer appearance-none pe-4 ps-10", className)} {...rest}>
      {children}
    </select>
  );
}

export function Field({ label, hint, error, children, className }: { label: string; hint?: string; error?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block space-y-2", className)}>
      <span className="block text-sm font-medium text-muted">{label}</span>
      {children}
      {error ? <span className="block text-xs text-rose">{error}</span> : hint ? <span className="block text-xs text-faint">{hint}</span> : null}
    </label>
  );
}

export function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean }) {
  return (
    <button
      type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition-colors duration-300 disabled:opacity-50", checked ? "bg-gradient-to-l from-amber to-gold" : "bg-surface-3")}
    >
      <motion.span
        layout transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-1 size-5 rounded-full bg-white shadow"
        style={{ insetInlineStart: checked ? "calc(100% - 1.5rem)" : "0.25rem" }}
      />
    </button>
  );
}

/* ---------- Badge ---------- */
const TONES = {
  gold: "bg-gold/12 text-gold border-gold/25",
  mint: "bg-mint/12 text-mint border-mint/25",
  sky: "bg-sky/12 text-[#9db0ff] border-sky/25",
  rose: "bg-rose/12 text-rose border-rose/25",
  gray: "bg-white/6 text-muted border-line",
};
export function Badge({ tone = "gray", className, children }: { tone?: keyof typeof TONES; className?: string; children: ReactNode }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium", TONES[tone], className)}>{children}</span>;
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog" aria-modal="true" aria-label={title}
            initial={{ opacity: 0, y: 50, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 30, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            className={cn("card-surface relative max-h-[92dvh] w-full max-w-[calc(100%-24px)] overflow-y-auto rounded-t-3xl p-6 shadow-2xl sm:rounded-3xl", wide ? "sm:max-w-2xl" : "sm:max-w-md")}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold">{title}</h2>
              <button onClick={onClose} aria-label="بستن" className="grid size-9 place-items-center rounded-lg text-muted transition hover:bg-white/10 hover:text-ink"><X className="size-5" /></button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, loading, confirmLabel = "حذف" }: { open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; loading?: boolean; confirmLabel?: string }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6 leading-7 text-muted">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose}>انصراف</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}

/* ---------- Misc ---------- */
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("size-5 animate-spin text-gold", className)} />;
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text?: string; action?: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-line-strong px-6 py-16 text-center overflow-hidden">
      <div className="grid size-16 place-items-center rounded-2xl bg-gold/10 text-gold">{icon}</div>
      <h3 className="text-lg font-bold">{title}</h3>
      {text && <p className="max-w-sm text-sm leading-7 text-muted">{text}</p>}
      {action}
    </motion.div>
  );
}

export function SectionTitle({ eyebrow, title, text, center }: { eyebrow?: string; title: ReactNode; text?: string; center?: boolean }) {
  return (
    <div className={cn("mb-8 space-y-3 sm:mb-10", center && "text-center mx-auto max-w-2xl")}>
      {eyebrow && <span className="inline-block rounded-full border border-gold/25 bg-gold/10 px-3 py-1 text-xs font-semibold text-gold">{eyebrow}</span>}
      <h2 className="text-2xl font-black leading-tight sm:text-3xl md:text-4xl">{title}</h2>
      {text && <p className="leading-8 text-muted">{text}</p>}
    </div>
  );
}
