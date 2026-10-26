import type { ImportFeeInput, VehicleInput } from "../types";

const base = { images: [], isPublished: true, status: "available" as const };

export const SEED_VEHICLES: VehicleInput[] = [
  { ...base, brand: "تویوتا", model: "Land Cruiser GXR", modelYear: 2023, aedPrice: 245000, mileage: 18000, engineCapacity: 4000, fuelType: "petrol", transmission: "automatic",
    features: ["چهار چرخ محرک", "سانروف", "سیستم صوتی JBL", "دوربین ۳۶۰ درجه", "صندلی چرم برقی"],
    description: "لندکروزر GXR مدل ۲۰۲۳ با اسپک GCC، سرویس‌های کامل نمایندگی و بدون هیچ‌گونه رنگ‌شدگی.",
    specifications: { color: "سفید صدفی", gccSpec: true, doors: 5, seats: 7 } },
  { ...base, brand: "نیسان", model: "Patrol Platinum", modelYear: 2022, aedPrice: 198000, mileage: 31000, engineCapacity: 5600, fuelType: "petrol", transmission: "automatic",
    features: ["موتور V8", "کروز کنترل تطبیقی", "نمایشگر رو به جلو", "صندلی خنک‌کننده"],
    description: "پاترول پلاتینیوم با موتور V8 و امکانات کامل؛ مناسب خانواده و مسیرهای سخت.",
    specifications: { color: "مشکی", gccSpec: true, doors: 5, seats: 8 } },
  { ...base, brand: "لکسوس", model: "LX 600", modelYear: 2024, aedPrice: 410000, mileage: 5200, engineCapacity: 3500, fuelType: "petrol", transmission: "automatic",
    features: ["توربو دوقلو", "تعلیق هوا", "سیستم صوتی مارک لوینسون", "صندلی ماساژور"],
    description: "لکسوس LX 600 تقریباً صفر با گارانتی معتبر؛ نماد راحتی و اطمینان.",
    specifications: { color: "نقره‌ای", gccSpec: true, doors: 5, seats: 5 } },
  { ...base, brand: "مرسدس‌بنز", model: "GLE 450", modelYear: 2022, aedPrice: 265000, mileage: 27000, engineCapacity: 3000, fuelType: "hybrid", transmission: "automatic",
    features: ["سیستم 48 ولت هیبرید", "پکیج AMG", "نمایشگر دوگانه MBUX", "سقف پانوراما"],
    description: "GLE 450 هیبرید با پکیج AMG، فوق‌العاده تمیز و با تاریخچه‌ی سرویس کامل.",
    specifications: { color: "آبی نفتی", gccSpec: true, doors: 5, seats: 5 } },
  { ...base, brand: "تسلا", model: "Model Y Long Range", modelYear: 2023, aedPrice: 175000, mileage: 14000, engineCapacity: 0, fuelType: "electric", transmission: "automatic",
    features: ["اتوپایلوت", "برد ۵۳۳ کیلومتر", "سقف شیشه‌ای", "شارژ سریع"],
    description: "مدل Y لانگ‌رنج با اتوپایلوت؛ برقی، ساکت و اقتصادی.",
    specifications: { color: "سفید", gccSpec: false, doors: 5, seats: 5 } },
  { ...base, status: "order" as const, brand: "پورشه", model: "Cayenne S", modelYear: 2023, aedPrice: 320000, mileage: 9000, engineCapacity: 2900, fuelType: "petrol", transmission: "automatic",
    features: ["پکیج اسپورت کرونو", "تعلیق PASM", "صدای بوز", "رینگ ۲۱ اینچ"],
    description: "کایین S با پکیج اسپورت کرونو؛ قابل سفارش با زمان تحویل مشخص.",
    specifications: { color: "خاکستری", gccSpec: true, doors: 5, seats: 5 } },
  { ...base, brand: "هیوندای", model: "Tucson Limited", modelYear: 2022, aedPrice: 82000, mileage: 38000, engineCapacity: 2000, fuelType: "petrol", transmission: "automatic",
    features: ["دوربین عقب", "کیلس و استارت", "کروز کنترل", "نمایشگر ۱۰ اینچ"],
    description: "توسان لیمیتد اقتصادی و تمیز، مناسب استفاده‌ی روزمره.",
    specifications: { color: "نقره‌ای", gccSpec: true, doors: 5, seats: 5 } },
  { ...base, brand: "تویوتا", model: "Camry SE", modelYear: 2021, aedPrice: 71000, mileage: 52000, engineCapacity: 2500, fuelType: "hybrid", transmission: "automatic",
    features: ["هیبرید", "سیستم ایمنی Toyota Safety Sense", "صندلی گرمکن‌دار"],
    description: "کمری هیبرید با مصرف بسیار پایین و سرویس‌های منظم.",
    specifications: { color: "مشکی", gccSpec: true, doors: 4, seats: 5 } },
  { ...base, brand: "فورد", model: "Ranger Wildtrak", modelYear: 2022, aedPrice: 118000, mileage: 44000, engineCapacity: 3000, fuelType: "diesel", transmission: "automatic",
    features: ["دیزل توربو", "چهار چرخ محرک", "ظرفیت یدک‌کشی ۳٫۵ تن"],
    description: "رنجر وایلدترک دیزلی، قدرتمند و آماده‌ی کار و ماجراجویی.",
    specifications: { color: "نارنجی", gccSpec: true, doors: 4, seats: 5 } },
];

export const SEED_FEES: ImportFeeInput[] = [
  { name: "حمل و بیمه", type: "fixed", value: 4500, currency: "AED", isEnabled: true, description: "حمل دریایی تا بندر و بیمه‌ی مسیر" },
  { name: "کارمزد خدمات", type: "percentage", value: 3, currency: "Toman", isEnabled: true, description: "هزینه‌ی خرید، بازرسی و مدیریت پرونده" },
  { name: "ترخیص و مستندسازی", type: "fixed", value: 35000000, currency: "Toman", isEnabled: true, description: "ترخیص، ثبت و پیگیری مدارک" },
];
