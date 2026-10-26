"use client";

import { motion } from "motion/react";
import { Clock, RefreshCw, Save, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { Button, Field, Input, Spinner, Switch } from "@/components/ui";
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
  const [autoMode, setAutoMode] = useState(!data.isManual);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Manual save handler
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const n = parseNum(rate);
    if (n <= 0) return toast.error("نرخ باید عددی بزرگ‌تر از صفر باشد.");
    setSaving(true);
    try {
      const payload = {
        rate: n,
        source: autoMode ? source || "priceto.day (خودکار)" : source || "دستی",
        isManual: !autoMode,
      };
      const updated = await api<ExchangeRate>("/api/exchange-rate", { method: "PUT", json: payload });
      onSaved(updated);
      toast.success("نرخ جدید با موفقیت ذخیره شد.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در ذخیره‌سازی.");
    } finally {
      setSaving(false);
    }
  }

  // Trigger immediate API refresh
  async function fetchLatestRate() {
    setRefreshing(true);
    try {
      const res = await api<{ success: boolean; rate: number; error?: string }>("/api/exchange-rate/update");
      if (res.success && res.rate) {
        setRate(String(res.rate));
        setSource("priceto.day (خودکار)");
        setAutoMode(true);
        // Refresh local resource data
        const updated = await api<ExchangeRate>("/api/exchange-rate");
        onSaved(updated);
        toast.success(`نرخ با موفقیت به روزرسانی شد: ${formatToman(res.rate)}`);
      } else {
        toast.error(res.error || "دریافت قیمت از سرویس آنلاین با خطا مواجه شد.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "خطا در برقراری ارتباط با سرویس نرخ ارز.");
    } finally {
      setRefreshing(false);
    }
  }

  const n = parseNum(rate);

  return (
    <>
      <PageHeader
        title="مدیریت نرخ ارز (درهم)"
        text="تنظیم نرخ هر ۱ درهم امارات به تومان جهت محاسبه‌ی لحظه‌ای قیمت خودروها."
      />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        {/* Left column: Controls */}
        <form onSubmit={save} className="card-surface space-y-6 rounded-3xl p-6">
          {/* Toggle Auto / Manual mode */}
          <div className="flex items-center justify-between rounded-2xl bg-surface-2 p-4 border border-line">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-semibold text-ink">
                <Zap className="size-4 text-amber" />
                <span>به‌روزرسانی خودکار نرخ ارز</span>
              </div>
              <p className="text-xs text-muted">
                دریافت آنلاین و هر ۵ دقیقه از API priceto.day
              </p>
            </div>
            <Switch
              checked={autoMode}
              onChange={(val) => {
                setAutoMode(val);
                if (val && !source.includes("priceto.day")) {
                  setSource("priceto.day (خودکار)");
                }
              }}
            />
          </div>

          {/* Quick Refresh Button when Auto is Enabled */}
          {autoMode && (
            <Button
              type="button"
              variant="outline"
              onClick={fetchLatestRate}
              loading={refreshing}
              className="w-full gap-2 border-amber/40 text-amber hover:bg-amber/10"
            >
              <RefreshCw className="size-4" />
              بروزرسانی آنی از API قیمت
            </Button>
          )}

          {/* Manual input fields */}
          <Field label="نرخ هر درهم (تومان)">
            <Input
              required
              dir="ltr"
              inputMode="numeric"
              value={rate}
              onChange={(e) => setRate(toEnDigits(e.target.value))}
              className="h-14 text-center text-xl font-bold"
            />
          </Field>

          <Field label="منبع نرخ ارز">
            <Input
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="مثلاً priceto.day یا صرافی..."
            />
          </Field>

          <Button type="submit" size="lg" loading={saving} className="w-full">
            <Save className="size-5" />
            ذخیره‌ی تنظیمات نرخ
          </Button>
        </form>

        {/* Right column: Current Status & Preview */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass space-y-5 rounded-3xl p-6"
        >
          <div className="space-y-1">
            <p className="text-sm text-muted">وضعیت و نرخ فعلی ثبت‌شده</p>
            <div className="flex items-center gap-2">
              <p className="text-3xl font-black gradient-text">
                {data && data.rate > 0 ? formatToman(data.rate) : "تنظیم نشده"}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  !data.isManual
                    ? "bg-mint/15 text-mint border border-mint/30"
                    : "bg-amber/15 text-amber border border-amber/30"
                }`}
              >
                {!data.isManual ? "خودکار" : "دستی"}
              </span>
            </div>
          </div>

          <div className="space-y-2 border-t border-line/50 pt-4 text-xs text-muted">
            <p className="flex items-center gap-2">
              <Clock className="size-4" />
              آخرین به‌روزرسانی: {data ? formatDateTime(data.lastUpdated) : "—"}
            </p>
            <p>منبع فعلی: <span className="text-ink font-medium">{data.source || "نامشخص"}</span></p>
          </div>

          <div className="rounded-2xl bg-white/5 p-4 text-sm border border-line/40">
            <p className="mb-1 text-muted">پیش‌نمایش: قیمت یک خودروی ۱۰,۰۰۰ درهمی</p>
            <p className="text-lg font-bold text-gold">
              {n > 0 ? formatToman(n * 10000) : "—"}
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
