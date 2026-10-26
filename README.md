# مستقر خودرو — واردات خودرو از امارات به ایران

وب‌سایت فارسی (RTL) با Next.js 16، React 19، Tailwind 4 و Motion؛ شامل کاتالوگ، ماشین‌حساب قیمت نهایی، فرم مشاوره و پنل مدیریت کامل.

## اجرا

```bash
npm install
cp .env.example .env.local   # و مقادیر را تنظیم کنید
npm run dev                  # http://localhost:3000
```

بدون `DATABASE_URL` پروژه با فایل `.data/db.json` و داده‌ی نمونه کار می‌کند (برای تست سریع).
برای PostgreSQL، `DATABASE_URL` را تنظیم کنید؛ جدول‌ها هنگام اولین اجرا خودکار ساخته می‌شوند.
برای درج خودروهای نمونه در PostgreSQL: `SEED_DEMO=true`.

## پنل مدیریت
آدرس `/admin` — نام کاربری و رمز از `ADMIN_USERNAME` و `ADMIN_PASSWORD`؛ حتماً `AUTH_SECRET` (حداقل ۳۲ کاراکتر) را در محیط production تنظیم کنید.
تصاویر آپلودی در `.data/uploads` (یا مسیر `UPLOAD_DIR`) ذخیره و از `/uploads/...` سرو می‌شوند.

## ساختار
- `src/lib/db` — ذخیره‌ساز PostgreSQL و JSON با یک رابط مشترک
- `src/lib/pricing.ts` — محاسبه‌ی قیمت نهایی (نرخ × قیمت درهم + هزینه‌ها)
- `src/proxy.ts` — محافظت از `/admin` (در Next 16 جایگزین middleware)
- `src/lib/importer.ts` — آداپتر همگام‌سازی (فعلاً آزمایشی؛ برای منبع واقعی `fetchListings` را جایگزین کنید)
