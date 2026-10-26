"use client";

import { AnimatePresence, motion } from "motion/react";
import { Car, Inbox, MessageCircle, Phone, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { ConfirmModal, EmptyState, Select, Spinner } from "@/components/ui";
import { api } from "@/lib/client-api";
import { REQUEST_LABEL, cn, formatDateTime, toEnDigits } from "@/lib/format";
import type { ConsultationRequest, RequestStatus } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

const FILTERS: Array<RequestStatus | "all"> = ["all", "pending", "contacted", "converted"];

function waLink(phone: string) {
  let d = toEnDigits(phone).replace(/\D/g, "");
  if (d.startsWith("00")) d = d.slice(2);
  else if (d.startsWith("0")) d = "98" + d.slice(1);
  return `https://wa.me/${d}`;
}

export default function RequestsPage() {
  const { data, loading, error, setData } = useResource<ConsultationRequest[]>("/api/requests");
  const [filter, setFilter] = useState<RequestStatus | "all">("all");
  const [del, setDel] = useState<ConsultationRequest | null>(null);
  const [busy, setBusy] = useState(false);
  const list = (data ?? []).filter((r) => filter === "all" || r.status === filter);

  async function setStatus(r: ConsultationRequest, status: RequestStatus) {
    const prev = data;
    setData((d) => d && d.map((x) => (x.id === r.id ? { ...x, status } : x)));
    try { await api(`/api/requests/${r.id}`, { method: "PATCH", json: { status } }); }
    catch (e) { setData(prev); toast.error(e instanceof Error ? e.message : "انجام نشد."); }
  }
  async function remove() {
    if (!del) return;
    setBusy(true);
    try { await api(`/api/requests/${del.id}`, { method: "DELETE" }); setData((d) => d && d.filter((x) => x.id !== del.id)); toast.success("حذف شد."); setDel(null); }
    catch (e) { toast.error(e instanceof Error ? e.message : "حذف نشد."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="درخواست‌های مشاوره" />
      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cn("relative rounded-xl px-4 py-2 text-sm font-medium transition", filter === f ? "text-[#1a1204]" : "text-muted hover:text-ink")}>
            {filter === f && <motion.span layoutId="req-filter" className="absolute inset-0 rounded-xl bg-gradient-to-l from-amber to-gold" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className="relative">{f === "all" ? "همه" : REQUEST_LABEL[f]}</span>
          </button>
        ))}
      </div>
      {loading && <div className="grid place-items-center py-24"><Spinner className="size-8" /></div>}
      {error && <p className="rounded-xl bg-rose/10 p-4 text-rose">{error}</p>}
      {data && list.length === 0 && <EmptyState icon={<Inbox className="size-8" />} title="درخواستی وجود ندارد" />}
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {list.map((r) => (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 40 }} className="card-surface space-y-3 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div><p className="font-bold">{r.name}</p><p className="mt-1 text-xs text-faint">{formatDateTime(r.submittedAt)}</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  <Select aria-label="وضعیت" value={r.status} onChange={(e) => setStatus(r, e.target.value as RequestStatus)} className="h-10 w-40 text-sm">{Object.entries(REQUEST_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
                  <a href={`tel:${r.phone}`} aria-label="تماس" className="grid size-10 place-items-center rounded-xl border border-line text-muted hover:border-gold/50 hover:text-gold"><Phone className="size-4" /></a>
                  <a href={waLink(r.phone)} target="_blank" rel="noopener noreferrer" aria-label="واتس‌اپ" className="grid size-10 place-items-center rounded-xl border border-line text-muted hover:border-mint/50 hover:text-mint"><MessageCircle className="size-4" /></a>
                  <button onClick={() => setDel(r)} aria-label="حذف" className="grid size-10 place-items-center rounded-xl border border-line text-muted hover:border-rose/50 hover:text-rose"><Trash2 className="size-4" /></button>
                </div>
              </div>
              <p className="text-sm text-muted" dir="ltr" style={{ textAlign: "right" }}>{r.phone}</p>
              {r.vehicleTitle && <p className="flex items-center gap-2 text-sm text-gold"><Car className="size-4" />{r.vehicleTitle}</p>}
              {r.message && <p className="whitespace-pre-line rounded-xl bg-white/4 p-3 text-sm leading-7">{r.message}</p>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} title="حذف درخواست" message={`درخواست «${del?.name}» حذف شود؟`} />
    </>
  );
}
