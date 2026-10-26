"use client";

import { AnimatePresence, motion } from "motion/react";
import { Coins, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { Badge, Button, ConfirmModal, EmptyState, Field, Input, Modal, Select, Spinner, Switch } from "@/components/ui";
import { api } from "@/lib/client-api";
import { FEE_CURRENCY_LABEL, parseNum, toEnDigits, toFa } from "@/lib/format";
import type { FeeCurrency, FeeType, ImportFee } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

const EMPTY = { name: "", type: "fixed" as FeeType, value: "", currency: "Toman" as FeeCurrency, description: "", isEnabled: true };

export default function FeesPage() {
  const { data, loading, error, reload } = useResource<ImportFee[]>("/api/fees?all=1");
  const [edit, setEdit] = useState<ImportFee | "new" | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState<ImportFee | null>(null);

  function open(f: ImportFee | "new") {
    setEdit(f);
    setForm(f === "new" ? EMPTY : { name: f.name, type: f.type, value: String(f.value), currency: f.currency, description: f.description, isEnabled: f.isEnabled });
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const value = parseNum(form.value);
    if (!form.name.trim()) return toast.error("نام هزینه را وارد کنید.");
    if (value < 0 || (form.type === "percentage" && value > 100)) return toast.error("مقدار نامعتبر است.");
    setSaving(true);
    try {
      const body = { ...form, value, currency: form.type === "percentage" ? "Toman" : form.currency };
      if (edit === "new") await api("/api/fees", { method: "POST", json: body });
      else if (edit) await api(`/api/fees/${edit.id}`, { method: "PATCH", json: body });
      toast.success("ذخیره شد.");
      setEdit(null);
      await reload();
    } catch (err) { toast.error(err instanceof Error ? err.message : "ذخیره نشد."); }
    finally { setSaving(false); }
  }
  async function toggle(f: ImportFee, v: boolean) {
    try { await api(`/api/fees/${f.id}`, { method: "PATCH", json: { isEnabled: v } }); await reload(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "انجام نشد."); }
  }
  async function remove() {
    if (!del) return;
    setSaving(true);
    try { await api(`/api/fees/${del.id}`, { method: "DELETE" }); toast.success("حذف شد."); setDel(null); await reload(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "حذف نشد."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <PageHeader title="هزینه‌های واردات" text="هزینه‌های فعال به‌صورت خودکار به قیمت نهایی همه‌ی خودروها اضافه می‌شوند." actions={<Button onClick={() => open("new")}><Plus className="size-5" />هزینه‌ی جدید</Button>} />
      {loading && <div className="grid place-items-center py-24"><Spinner className="size-8" /></div>}
      {error && <p className="rounded-xl bg-rose/10 p-4 text-rose">{error}</p>}
      {data && data.length === 0 && <EmptyState icon={<Coins className="size-8" />} title="هنوز هزینه‌ای تعریف نشده" action={<Button onClick={() => open("new")}>افزودن هزینه</Button>} />}
      <div className="grid gap-4 md:grid-cols-2">
        <AnimatePresence initial={false}>
          {data?.map((f) => (
            <motion.div key={f.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: f.isEnabled ? 1 : 0.55, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card-surface space-y-4 rounded-3xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="font-bold">{f.name}</h3>{f.description && <p className="mt-1 text-xs leading-6 text-muted">{f.description}</p>}</div>
                <Switch checked={f.isEnabled} onChange={(v) => toggle(f, v)} label={`فعال‌سازی ${f.name}`} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2"><Badge tone="gold">{f.type === "percentage" ? "درصدی" : "ثابت"}</Badge><span className="text-lg font-black">{toFa(f.value)} {f.type === "percentage" ? "٪" : FEE_CURRENCY_LABEL[f.currency]}</span></div>
                <div className="flex gap-1.5">
                  <button onClick={() => open(f)} aria-label="ویرایش" className="grid size-9 place-items-center rounded-xl border border-line text-muted hover:border-gold/50 hover:text-gold"><Pencil className="size-4" /></button>
                  <button onClick={() => setDel(f)} aria-label="حذف" className="grid size-9 place-items-center rounded-xl border border-line text-muted hover:border-rose/50 hover:text-rose"><Trash2 className="size-4" /></button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal open={edit !== null} onClose={() => setEdit(null)} title={edit === "new" ? "هزینه‌ی جدید" : "ویرایش هزینه"}>
        <form onSubmit={save} className="space-y-4">
          <Field label="نام هزینه"><Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثلاً حمل و بیمه" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="نوع"><Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FeeType })}><option value="fixed">مبلغ ثابت</option><option value="percentage">درصدی</option></Select></Field>
            {form.type === "fixed" && <Field label="واحد"><Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value as FeeCurrency })}>{Object.entries(FEE_CURRENCY_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>}
          </div>
          <Field label={form.type === "percentage" ? "درصد (از قیمت تومانی خودرو)" : "مبلغ"}><Input required dir="ltr" inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: toEnDigits(e.target.value) })} className="text-end" /></Field>
          <Field label="توضیحات (اختیاری)"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <div className="flex justify-end gap-3 pt-2"><Button type="button" variant="ghost" onClick={() => setEdit(null)}>انصراف</Button><Button type="submit" loading={saving}>ذخیره</Button></div>
        </form>
      </Modal>
      <ConfirmModal open={!!del} onClose={() => setDel(null)} onConfirm={remove} loading={saving} title="حذف هزینه" message={`هزینه‌ی «${del?.name}» حذف شود؟`} />
    </>
  );
}
