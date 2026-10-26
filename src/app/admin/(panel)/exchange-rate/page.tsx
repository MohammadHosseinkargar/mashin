"use client";

import { motion } from "motion/react";
import { Clock, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { Button, Field, Input, Spinner } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatDateTime, formatToman, parseNum, toEnDigits } from "@/lib/format";
import type { ExchangeRate } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

export default function ExchangeRatePage() {
  const { data, loading, error, setData } = useResource<ExchangeRate>("/api/exchange-rate");
  if (loading) return <div className="grid place-items-center py-24"><Spinner className="size-8" /></div>;
  if (error || !data) return <p className="rounded-xl bg-rose/10 p-4 text-rose">{error ?? "خطا"}</p>;
  return <RateForm data={data} onSaved={setData} />;
}

function RateForm({ data, onSaved }: { data: ExchangeRate; onSaved: (r: ExchangeRate) => void }) {
  const [rate, setRate] = useState(data.rate ? String(data.rate) : "");
  const [source, setSource] = useState(data.source);
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = parseNum(rate);
    if (n <= 0) return toast.error("نرخ باید عددی بزرگ‌تر از صفر باشد.");
    setSaving(true);
    try {
      onSaved(await api<ExchangeRate>("/api/exchange-rate", { method: "PUT", json: { rate: n, source: source || "دستی", isManual: true } }));
      toast.success("نرخ جدید ذخیره شد.");
    } catch (err) { toast.error(err instanceof Error ? err.message : "ذخیره نشد."); }
    finally { setSaving(false); }
  }

  const n = parseNum(rate);
  return (
    <>
      <PageHeader title="نرخ ارز" text="نرخ هر ۱ درهم امارات به تومان؛ مبنای محاسبه‌ی قیمت همه‌ی خودروها." />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <form onSubmit={save} className="card-surface space-y-5 rounded-3xl p-6">
          <Field label="نرخ هر درهم (تومان)"><Input required dir="ltr" inputMode="numeric" value={rate} onChange={(e) => setRate(toEnDigits(e.target.value))} className="h-14 text-center text-xl font-bold" /></Field>
          <Field label="منبع نرخ"><Input value={source} onChange={(e) => setSource(e.target.value)} placeholder="مثلاً صرافی ..." /></Field>
          <Button type="submit" size="lg" loading={saving} className="w-full"><Save className="size-5" />ذخیره‌ی نرخ</Button>
        </form>
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="glass space-y-4 rounded-3xl p-6">
          <p className="text-sm text-muted">نرخ فعلی ثبت‌شده</p>
          <p className="text-3xl font-black gradient-text">{data && data.rate > 0 ? formatToman(data.rate) : "تنظیم نشده"}</p>
          <p className="flex items-center gap-2 text-xs text-muted"><Clock className="size-4" />آخرین به‌روزرسانی: {data ? formatDateTime(data.lastUpdated) : "—"}</p>
          <div className="rounded-2xl bg-white/4 p-4 text-sm">
            <p className="mb-1 text-muted">پیش‌نمایش: یک خودروی ۱۰۰٬۰۰۰ درهمی</p>
            <p className="font-bold">{n > 0 ? formatToman(n * 100000) : "—"}</p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
