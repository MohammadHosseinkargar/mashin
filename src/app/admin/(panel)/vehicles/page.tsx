"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Car, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { CarSilhouette } from "@/components/car-art";
import { ConfirmModal, EmptyState, Input, LinkButton, Select, Spinner, Switch } from "@/components/ui";
import { api } from "@/lib/client-api";
import { STATUS_LABEL, formatAed, toFa, toFaPlain } from "@/lib/format";
import type { Vehicle } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

export default function AdminVehiclesPage() {
  const { data, loading, error, setData } = useResource<{ items: Vehicle[]; total: number }>("/api/vehicles?all=1&limit=500");
  const [q, setQ] = useState("");
  const [del, setDel] = useState<Vehicle | null>(null);
  const [busy, setBusy] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.items ?? []).filter((v) => !s || `${v.brand} ${v.model}`.toLowerCase().includes(s));
  }, [data, q]);

  async function patch(v: Vehicle, body: Partial<Vehicle>) {
    const prev = data;
    setData((d) => d && { ...d, items: d.items.map((x) => (x.id === v.id ? { ...x, ...body } : x)) });
    try { await api(`/api/vehicles/${v.id}`, { method: "PATCH", json: body }); }
    catch (e) { setData(prev); toast.error(e instanceof Error ? e.message : "ذخیره نشد."); }
  }
  async function remove() {
    if (!del) return;
    setBusy(true);
    try {
      await api(`/api/vehicles/${del.id}`, { method: "DELETE" });
      setData((d) => d && { total: d.total - 1, items: d.items.filter((x) => x.id !== del.id) });
      toast.success("خودرو حذف شد.");
      setDel(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : "حذف نشد."); }
    finally { setBusy(false); }
  }

  return (
    <>
      <PageHeader title="خودروها" text={data ? `${toFa(data.total)} خودرو ثبت شده است.` : undefined} actions={<LinkButton href="/admin/vehicles/new"><Plus className="size-5" />افزودن خودرو</LinkButton>} />
      <div className="relative mb-5 max-w-md"><Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-faint" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو در خودروها..." className="ps-12" aria-label="جستجو" /></div>

      {loading && <div className="grid place-items-center py-24"><Spinner className="size-8" /></div>}
      {error && <p className="rounded-xl bg-rose/10 p-4 text-rose">{error}</p>}
      {!loading && !error && list.length === 0 && (
        <EmptyState icon={<Car className="size-8" />} title={q ? "نتیجه‌ای پیدا نشد" : "هنوز خودرویی ثبت نشده"} text={q ? undefined : "اولین خودرو را اضافه کنید."} action={!q && <LinkButton href="/admin/vehicles/new">افزودن خودرو</LinkButton>} />
      )}

      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {list.map((v, i) => (
            <motion.div key={v.id} layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 8) * 0.04 } }} exit={{ opacity: 0, x: 40 }} className="card-surface flex flex-wrap items-center gap-4 rounded-2xl p-4">
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-3">
                {v.images[0] ? <img src={v.images[0]} alt="" className="size-full object-cover" /> : <div className="grid size-full place-items-center p-1"><CarSilhouette className="w-full" /></div>}
              </div>
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate font-bold" dir="auto">{v.brand} {v.model}</p>
                <p className="mt-1 text-sm text-muted">{toFaPlain(v.modelYear)} · {formatAed(v.aedPrice)}</p>
              </div>
              <Select aria-label="وضعیت" value={v.status} onChange={(e) => patch(v, { status: e.target.value as Vehicle["status"] })} className="h-10 w-36 text-sm">
                {Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
              </Select>
              <label className="flex items-center gap-2 text-sm text-muted"><Switch checked={v.isPublished} onChange={(c) => patch(v, { isPublished: c })} label="نمایش در سایت" />{v.isPublished ? "منتشرشده" : "پیش‌نویس"}</label>
              <div className="flex gap-1.5">
                <Link href={`/admin/vehicles/${v.id}`} aria-label="ویرایش" className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-gold/50 hover:text-gold"><Pencil className="size-4" /></Link>
                <button onClick={() => setDel(v)} aria-label="حذف" className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-rose/50 hover:text-rose"><Trash2 className="size-4" /></button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={busy} title="حذف خودرو" message={`آیا از حذف «${del?.brand} ${del?.model}» مطمئن هستید؟ این کار قابل بازگشت نیست.`} />
    </>
  );
}
