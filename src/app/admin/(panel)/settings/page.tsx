"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin-shell";
import { Button, Field, Input, Spinner, Textarea } from "@/components/ui";
import { api } from "@/lib/client-api";
import { toEnDigits } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import { useResource } from "@/lib/use-resource";

type Form = Omit<SiteSettings, "updatedAt">;

export default function SettingsPage() {
  const { data, loading, error } = useResource<SiteSettings>("/api/settings");
  if (loading) return <div className="grid place-items-center py-24"><Spinner className="size-8" /></div>;
  if (error || !data) return <p className="rounded-xl bg-rose/10 p-4 text-rose">{error ?? "خطا"}</p>;
  return <SettingsForm initial={data} />;
}

function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [f, setF] = useState<Form>(() => {
    const { updatedAt, ...rest } = initial;
    void updatedAt;
    return rest;
  });
  const [saving, setSaving] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await api("/api/settings", { method: "PUT", json: f }); toast.success("تنظیمات ذخیره شد."); }
    catch (err) { toast.error(err instanceof Error ? err.message : "ذخیره نشد."); }
    finally { setSaving(false); }
  }
  const set = (k: keyof Form, v: string) => setF({ ...f, [k]: v });

  return (
    <>
      <PageHeader title="تنظیمات سایت" />
      <form onSubmit={save} className="card-surface max-w-3xl space-y-5 rounded-3xl p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="نام سایت"><Input required value={f.siteTitle} onChange={(e) => set("siteTitle", e.target.value)} /></Field>
          <Field label="ایمیل"><Input dir="ltr" type="email" value={f.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="text-end" /></Field>
          <Field label="تلفن تماس"><Input dir="ltr" value={f.contactPhone} onChange={(e) => set("contactPhone", toEnDigits(e.target.value))} className="text-end" /></Field>
          <Field label="شماره‌ی واتس‌اپ" hint="با کد کشور و بدون +؛ مثلاً 989123456789"><Input dir="ltr" value={f.whatsappNumber} onChange={(e) => set("whatsappNumber", toEnDigits(e.target.value))} className="text-end" /></Field>
        </div>
        <Field label="توضیح کوتاه سایت"><Textarea value={f.siteDescription} onChange={(e) => set("siteDescription", e.target.value)} className="min-h-20" /></Field>
        <Field label="پیام پیش‌فرض واتس‌اپ"><Input value={f.whatsappMessage} onChange={(e) => set("whatsappMessage", e.target.value)} /></Field>
        <Field label="نشانی"><Input value={f.address} onChange={(e) => set("address", e.target.value)} /></Field>
        <Button type="submit" size="lg" loading={saving}><Save className="size-5" />ذخیره‌ی تنظیمات</Button>
      </form>
    </>
  );
}
