"use client";

import { CheckCircle2, DownloadCloud, FlaskConical, RefreshCw } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { Button, Spinner, Switch } from "@/components/ui";
import { api } from "@/lib/client-api";
import { formatDateTime, toFa } from "@/lib/format";
import type { ImportSettings } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

interface Result {
  created: number;
  updated: number;
  unchanged: number;
  images: number;
  pages: number;
  dryRun: boolean;
  total: number;
  cursorPage: number;
  totalPages: number;
  totalResults: number;
  done: boolean;
  blocked: boolean;
  budgetHit: boolean;
}

export default function ImportsPage() {
  const { data, loading, error, setData } = useResource<ImportSettings>("/api/admin/imports");
  const [busy, setBusy] = useState<"sync" | "dry" | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function toggle(enabled: boolean) {
    try { setData(await api<ImportSettings>("/api/admin/imports", { method: "POST", json: { action: "toggle", enabled } })); }
    catch (e) { toast.error(e instanceof Error ? e.message : "انجام نشد."); }
  }
  async function sync(dryRun: boolean) {
    setBusy(dryRun ? "dry" : "sync");
    try {
      const r = await api<{ result: Result; settings: ImportSettings }>("/api/admin/imports", { method: "POST", json: { action: "sync", dryRun } });
      setResult(r.result); setData(r.settings);
      toast.success(
        dryRun
          ? "اجرای آزمایشی انجام شد (چیزی ذخیره نشد)."
          : r.result.done
            ? "چرخه‌ی کامل صفحه‌ها همگام‌سازی شد."
            : "یک دسته همگام‌سازی شد؛ ادامه‌ی خودکار با worker و هر ۱۰ دقیقه."
      );
    } catch (e) { toast.error(e instanceof Error ? e.message : "همگام‌سازی ناموفق بود."); }
    finally { setBusy(null); }
  }
  if (loading) return <div className="grid place-items-center py-24"><Spinner className="size-8" /></div>;
  if (error || !data) return <p className="rounded-xl bg-rose/10 p-4 text-rose">{error ?? "خطا"}</p>;

  return (
    <>
      <PageHeader
        title="همگام‌سازی خودروها"
        text="دریافت خودکار همه‌ی آگهی‌های Dubicars (عکس، قیمت و مشخصات) و انتشار مستقیم در کاتالوگ؛ صفحه‌ها با cursor چرخه‌ای پیش می‌روند. برای به‌روزرسانی خودکار هر ۱۰ دقیقه، listings:worker را اجرا کنید."
      />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <section className="card-surface space-y-5 rounded-3xl p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-black">فعال‌سازی</h2><p className="mt-1 text-xs text-muted">برای اجرای همگام‌سازی باید فعال باشد.</p></div><Switch checked={data.enabled} onChange={toggle} label="فعال‌سازی همگام‌سازی" /></div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => sync(false)} loading={busy === "sync"} disabled={!data.enabled || busy !== null}><DownloadCloud className="size-5" />شروع همگام‌سازی</Button>
            <Button variant="outline" onClick={() => sync(true)} loading={busy === "dry"} disabled={!data.enabled || busy !== null}><FlaskConical className="size-5" />اجرای آزمایشی</Button>
          </div>
          {result && (
            <div className="flex items-start gap-3 rounded-xl bg-mint/10 p-4 text-sm text-mint">
              <CheckCircle2 className="size-5 shrink-0" />
              <div className="space-y-1">
                <p>
                  {result.dryRun ? "آزمایشی: " : ""}
                  {toFa(result.pages)} صفحه ({toFa(result.total)} آگهی): {toFa(result.created)} جدید، {toFa(result.updated)} به‌روزرسانی، {toFa(result.unchanged)} بدون تغییر
                  {result.images ? `، ${toFa(result.images)} تصویر تازه` : ""}.
                </p>
                {result.totalPages > 0 && (
                  <p className="text-muted">
                    پیشرفت چرخه: صفحه‌ی {toFa(result.cursorPage)} از {toFa(result.totalPages)} ({toFa(result.totalResults)} نتیجه در Dubicars)
                    {result.done && " — چرخه کامل شد"}
                  </p>
                )}
                {result.blocked && (
                  <p className="text-rose">Dubicars درخواست را مسدود کرد؛ اجرای بعدی از همین صفحه ادامه می‌دهد.</p>
                )}
              </div>
            </div>
          )}
        </section>
        <section className="card-surface space-y-3 rounded-3xl p-6 text-sm">
          <h2 className="flex items-center gap-2 font-black"><RefreshCw className="size-5 text-gold" />آمار</h2>
          {[
            ["آخرین همگام‌سازی", formatDateTime(data.lastSyncAt)],
            ["پیشرفت چرخه", data.totalPages > 0 ? `${toFa(data.cursorPage)} از ${toFa(data.totalPages)} صفحه` : "شروع نشده"],
            ["کل نتایج Dubicars", data.totalResults > 0 ? toFa(data.totalResults) : "—"],
            ["مجموع واردشده", toFa(data.totalImported)],
            ["مجموع به‌روزرسانی", toFa(data.totalUpdated)],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between rounded-xl bg-white/4 px-4 py-3"><span className="text-muted">{l}</span><span className="font-bold">{v}</span></div>
          ))}
          {data.lastError && <p className="rounded-xl bg-rose/10 p-3 text-rose">آخرین خطا: {data.lastError}</p>}
        </section>
      </div>
    </>
  );
}
