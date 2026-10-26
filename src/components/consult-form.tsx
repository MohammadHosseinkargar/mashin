"use client";

import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button, Field, Input, Textarea } from "./ui";

export function ConsultForm({ vehicleId, vehicleTitle, compact }: { vehicleId?: string; vehicleTitle?: string; compact?: boolean }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(vehicleTitle ? `درخواست مشاوره برای ${vehicleTitle}` : "");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await api("/api/requests", { method: "POST", json: { name, phone, message, vehicleId: vehicleId ?? null } });
      setDone(true);
      toast.success("درخواست شما ثبت شد؛ به‌زودی تماس می‌گیریم.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ثبت درخواست انجام نشد.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      {done ? (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 py-10 text-center">
          <motion.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.1 }} className="grid size-16 place-items-center rounded-full bg-mint/15 text-mint"><CheckCircle2 className="size-9" /></motion.div>
          <h3 className="text-xl font-black">درخواست شما ثبت شد</h3>
          <p className="max-w-xs text-sm leading-7 text-muted">کارشناسان ما در اولین فرصت با شما تماس خواهند گرفت.</p>
          <Button variant="ghost" size="sm" onClick={() => { setDone(false); setName(""); setPhone(""); }}>ثبت درخواست جدید</Button>
        </motion.div>
      ) : (
        <motion.form key="form" onSubmit={submit} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
          <div className={compact ? "space-y-4" : "grid gap-4 sm:grid-cols-2"}>
            <Field label="نام و نام خانوادگی"><Input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} placeholder="مثلاً علی رضایی" autoComplete="name" /></Field>
            <Field label="شماره تماس"><Input required dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" autoComplete="tel" className="text-end" /></Field>
          </div>
          <Field label="توضیحات (اختیاری)"><Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="خودرو یا بودجه‌ی مدنظر خود را بنویسید..." className="min-h-24" /></Field>
          <Button type="submit" size="lg" loading={loading} className="w-full"><Send className="size-4 -scale-x-100" />ثبت درخواست مشاوره</Button>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
