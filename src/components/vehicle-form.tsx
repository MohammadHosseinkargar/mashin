"use client";

import { AnimatePresence, motion } from "motion/react";
import { ImagePlus, Link2, Plus, Save, Star, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import type { FuelType, Transmission, Vehicle, VehicleStatus } from "@/lib/types";
import { FUEL_LABEL, STATUS_LABEL, TRANS_LABEL, parseNum, toEnDigits } from "@/lib/format";
import { Button, Field, Input, Select, Switch, Textarea } from "./ui";

export function VehicleForm({ vehicle }: { vehicle?: Vehicle }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const spec = vehicle?.specifications ?? {};
  const [f, setF] = useState({
    brand: vehicle?.brand ?? "",
    model: vehicle?.model ?? "",
    modelYear: String(vehicle?.modelYear ?? new Date().getFullYear()),
    aedPrice: vehicle ? String(vehicle.aedPrice) : "",
    mileage: String(vehicle?.mileage ?? 0),
    engineCapacity: String(vehicle?.engineCapacity ?? 0),
    fuelType: (vehicle?.fuelType ?? "petrol") as FuelType,
    transmission: (vehicle?.transmission ?? "automatic") as Transmission,
    status: (vehicle?.status ?? "available") as VehicleStatus,
    description: vehicle?.description ?? "",
    isPublished: vehicle?.isPublished ?? false,
    color: String(spec.color ?? ""),
    seats: spec.seats ? String(spec.seats) : "",
    location: String(spec.location ?? ""),
    gccSpec: spec.gccSpec === true,
  });
  const [images, setImages] = useState<string[]>(vehicle?.images ?? []);
  const [features, setFeatures] = useState<string[]>(vehicle?.features ?? []);
  const [featureInput, setFeatureInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) throw new Error(json?.error || "آپلود ناموفق بود");
        setImages((p) => [...p, json.data.url]);
      }
      toast.success("تصویر بارگذاری شد.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "آپلود ناموفق بود");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function addFeature() {
    const v = featureInput.trim();
    if (v && !features.includes(v)) setFeatures((p) => [...p, v]);
    setFeatureInput("");
  }
  function addUrl() {
    const v = urlInput.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) return toast.error("آدرس باید با http:// یا https:// شروع شود.");
    setImages((p) => [...p, v]);
    setUrlInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    const aed = parseNum(f.aedPrice);
    if (aed <= 0) return toast.error("قیمت به درهم را وارد کنید.");
    setSaving(true);
    try {
      const specifications: Record<string, string | number | boolean> = { ...spec, gccSpec: f.gccSpec };
      const setOrDrop = (k: string, v: string | number) => (v === "" || v === 0 ? delete specifications[k] : (specifications[k] = v));
      setOrDrop("color", f.color.trim());
      setOrDrop("location", f.location.trim());
      setOrDrop("seats", f.seats ? parseNum(f.seats) : "");
      const body = {
        brand: f.brand, model: f.model, modelYear: parseNum(f.modelYear), aedPrice: aed, images, specifications,
        mileage: parseNum(f.mileage), engineCapacity: parseNum(f.engineCapacity), fuelType: f.fuelType, transmission: f.transmission,
        features, description: f.description, status: f.status, isPublished: f.isPublished,
      };
      if (vehicle) await api(`/api/vehicles/${vehicle.id}`, { method: "PATCH", json: body });
      else await api("/api/vehicles", { method: "POST", json: body });
      toast.success(vehicle ? "تغییرات ذخیره شد." : "خودرو افزوده شد.");
      router.push("/admin/vehicles");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "ذخیره انجام نشد.");
      setSaving(false);
    }
  }

  const card = "card-surface space-y-5 rounded-3xl p-6";
  return (
    <form onSubmit={submit} className="grid gap-6 overflow-hidden xl:grid-cols-[1.6fr_1fr]">
      <div className="space-y-6">
        <section className={card}>
          <h2 className="font-black">اطلاعات اصلی</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="برند"><Input required value={f.brand} onChange={(e) => set("brand", e.target.value)} placeholder="تویوتا" /></Field>
            <Field label="مدل"><Input required value={f.model} onChange={(e) => set("model", e.target.value)} placeholder="Land Cruiser GXR" /></Field>
            <Field label="سال ساخت (میلادی)"><Input required dir="ltr" inputMode="numeric" value={f.modelYear} onChange={(e) => set("modelYear", toEnDigits(e.target.value))} className="text-end" /></Field>
            <Field label="قیمت در امارات (درهم)"><Input required dir="ltr" inputMode="numeric" value={f.aedPrice} onChange={(e) => set("aedPrice", toEnDigits(e.target.value))} placeholder="120000" className="text-end" /></Field>
            <Field label="کارکرد (کیلومتر)"><Input dir="ltr" inputMode="numeric" value={f.mileage} onChange={(e) => set("mileage", toEnDigits(e.target.value))} className="text-end" /></Field>
            <Field label="حجم موتور (سی‌سی؛ برقی = ۰)"><Input dir="ltr" inputMode="numeric" value={f.engineCapacity} onChange={(e) => set("engineCapacity", toEnDigits(e.target.value))} className="text-end" /></Field>
            <Field label="سوخت"><Select value={f.fuelType} onChange={(e) => set("fuelType", e.target.value as FuelType)}>{Object.entries(FUEL_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
            <Field label="گیربکس"><Select value={f.transmission} onChange={(e) => set("transmission", e.target.value as Transmission)}>{Object.entries(TRANS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          </div>
          <Field label="توضیحات"><Textarea value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="وضعیت ظاهری، سرویس‌ها، نکات مهم..." /></Field>
        </section>

        <section className={card}>
          <h2 className="font-black">جزئیات تکمیلی</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="رنگ"><Input value={f.color} onChange={(e) => set("color", e.target.value)} /></Field>
            <Field label="ظرفیت (نفر)"><Input dir="ltr" inputMode="numeric" value={f.seats} onChange={(e) => set("seats", toEnDigits(e.target.value))} className="text-end" /></Field>
            <Field label="موقعیت در امارات"><Input value={f.location} onChange={(e) => set("location", e.target.value)} placeholder="دبی" /></Field>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3"><span className="text-sm">اسپک GCC (مخصوص بازار خلیج)</span><Switch checked={f.gccSpec} onChange={(v) => set("gccSpec", v)} label="اسپک GCC" /></div>
          <div className="space-y-3">
            <span className="text-sm font-medium text-muted">امکانات</span>
            <div className="flex gap-2">
              <Input value={featureInput} onChange={(e) => setFeatureInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }} placeholder="مثلاً سانروف (Enter برای افزودن)" />
              <Button type="button" variant="secondary" onClick={addFeature} aria-label="افزودن امکانات"><Plus className="size-5" /></Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {features.map((x) => (
                  <motion.span key={x} layout initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.7, opacity: 0 }} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/5 py-1.5 ps-3.5 pe-2 text-sm">
                    {x}<button type="button" onClick={() => setFeatures((p) => p.filter((y) => y !== x))} aria-label={`حذف ${x}`} className="grid size-5 place-items-center rounded-full hover:bg-rose/20 hover:text-rose"><X className="size-3.5" /></button>
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className={card}>
          <h2 className="font-black">انتشار</h2>
          <Field label="وضعیت موجودی"><Select value={f.status} onChange={(e) => set("status", e.target.value as VehicleStatus)}>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
          <div className="flex items-center justify-between rounded-xl bg-white/4 px-4 py-3"><span className="text-sm">نمایش در سایت</span><Switch checked={f.isPublished} onChange={(v) => set("isPublished", v)} label="نمایش در سایت" /></div>
          <Button type="submit" size="lg" loading={saving} className="w-full"><Save className="size-5" />{vehicle ? "ذخیره‌ی تغییرات" : "افزودن خودرو"}</Button>
        </section>

        <section className={card}>
          <h2 className="font-black">تصاویر <span className="text-xs font-normal text-faint">(اولین تصویر، تصویر اصلی است)</span></h2>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => upload(e.target.files)} />
          <Button type="button" variant="outline" className="w-full" loading={uploading} onClick={() => fileRef.current?.click()}><ImagePlus className="size-5" />آپلود تصویر</Button>
          <div className="flex gap-2">
            <Input dir="ltr" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }} placeholder="https://..." className="text-end" />
            <Button type="button" variant="secondary" onClick={addUrl} aria-label="افزودن از لینک"><Link2 className="size-5" /></Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <AnimatePresence>
              {images.map((src, i) => (
                <motion.div key={src} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line">
                  <img src={src} alt={`تصویر ${i + 1}`} className="size-full object-cover" />
                  {i === 0 && <span className="absolute start-1.5 top-1.5 rounded-md bg-gold px-1.5 py-0.5 text-[10px] font-bold text-[#1a1204]">اصلی</span>}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition group-hover:opacity-100">
                    {i !== 0 && <button type="button" onClick={() => setImages((p) => [src, ...p.filter((x) => x !== src)])} aria-label="تصویر اصلی" className="grid size-9 place-items-center rounded-lg bg-white/15 hover:bg-gold hover:text-[#1a1204]"><Star className="size-4" /></button>}
                    <button type="button" onClick={() => setImages((p) => p.filter((x) => x !== src))} aria-label="حذف تصویر" className="grid size-9 place-items-center rounded-lg bg-white/15 hover:bg-rose"><Trash2 className="size-4" /></button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          {images.length === 0 && <p className="text-xs leading-6 text-faint">بدون تصویر، یک تصویر گرافیکی جایگزین نمایش داده می‌شود.</p>}
        </section>
      </div>
    </form>
  );
}
