import { z } from "zod";
import { toEnDigits } from "./format";

// پیام‌های پیش‌فرض zod انگلیسی هستند و مستقیم به کاربر نشان داده می‌شوند.
// پیام‌های اختصاصی هر فیلد (که پایین‌تر تعریف شده‌اند) همچنان اولویت دارند.
z.setErrorMap((issue, ctx) => {
  switch (issue.code) {
    case "invalid_type":
    case "invalid_enum_value":
    case "invalid_string":
    case "invalid_union":
    case "invalid_arguments":
    case "invalid_return_type":
      return { message: "مقدار وارد شده معتبر نیست" };
    case "too_small":
      return { message: "مقدار وارد شده کوچک‌تر از حد مجاز است" };
    case "too_big":
      return { message: "مقدار وارد شده بزرگ‌تر از حد مجاز است" };
    case "invalid_date":
      return { message: "تاریخ وارد شده معتبر نیست" };
    default:
      return { message: ctx.defaultError };
  }
});

const num = (min: number, max: number) =>
  z.preprocess((v) => (typeof v === "string" ? Number(toEnDigits(v).replace(/[,٬\s]/g, "")) : v), z.number().finite().min(min).max(max));

const imageUrl = z
  .string()
  .trim()
  .max(1000)
  .refine((u) => /^https?:\/\//i.test(u) || /^\/uploads\/[\w.-]+$/.test(u), "آدرس تصویر باید با http(s):// یا /uploads/ شروع شود");

export const vehicleSchema = z.object({
  brand: z.string().trim().min(1, "برند را وارد کنید").max(100),
  model: z.string().trim().min(1, "مدل را وارد کنید").max(200),
  modelYear: num(1950, new Date().getFullYear() + 2).pipe(z.number().int()),
  aedPrice: num(1, 1_000_000_000),
  images: z.array(imageUrl).max(12).default([]),
  specifications: z.record(z.string().max(60), z.union([z.string().max(300), z.number(), z.boolean()])).default({}),
  mileage: num(0, 5_000_000).pipe(z.number().int()).default(0),
  engineCapacity: num(0, 20_000).pipe(z.number().int()).default(0),
  fuelType: z.enum(["petrol", "diesel", "electric", "hybrid"]),
  transmission: z.enum(["manual", "automatic"]),
  features: z.array(z.string().trim().min(1).max(120)).max(40).default([]),
  description: z.string().trim().max(5000).default(""),
  status: z.enum(["available", "order", "unavailable"]).default("available"),
  isPublished: z.boolean().default(false),
});
export const vehiclePatchSchema = vehicleSchema.partial();

export const feeSchema = z.object({
  name: z.string().trim().min(1, "نام هزینه را وارد کنید").max(200),
  type: z.enum(["fixed", "percentage"]),
  value: num(0, 1e15),
  currency: z.enum(["AED", "Toman", "Rial"]).default("Toman"),
  isEnabled: z.boolean().default(true),
  description: z.string().trim().max(500).default(""),
});
export const feePatchSchema = feeSchema.partial();

export const rateSchema = z.object({
  rate: num(1, 1e9),
  source: z.string().trim().max(200).default("دستی"),
  isManual: z.boolean().default(true),
});

export const requestSchema = z.object({
  name: z.string().trim().min(2, "نام را وارد کنید").max(120),
  phone: z
    .string()
    .transform((s) => toEnDigits(s).replace(/[\s\-()]/g, ""))
    .refine((s) => /^\+?\d{10,15}$/.test(s), "شماره تماس معتبر نیست"),
  message: z.string().trim().max(2000).default(""),
  vehicleId: z.string().uuid().nullable().optional(),
});

export const requestStatusSchema = z.object({ status: z.enum(["pending", "contacted", "converted"]) });

export const settingsSchema = z
  .object({
    siteTitle: z.string().trim().min(1).max(120),
    siteDescription: z.string().trim().max(500),
    whatsappNumber: z
      .string()
      .transform((s) => toEnDigits(s).replace(/[\s\-+()]/g, ""))
      .refine((s) => s === "" || /^\d{8,15}$/.test(s), "شماره واتساپ معتبر نیست (با کد کشور، بدون +)"),
    whatsappMessage: z.string().trim().max(500),
    contactEmail: z.string().trim().max(200).refine((s) => s === "" || /^\S+@\S+\.\S+$/.test(s), "ایمیل معتبر نیست"),
    contactPhone: z.string().trim().max(50),
    address: z.string().trim().max(500),
  })
  .partial();
