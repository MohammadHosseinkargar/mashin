import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "مستقر خودرو | واردات خودرو از امارات به ایران", template: "%s | مستقر خودرو" },
  description: "خرید و واردات خودرو از امارات با قیمت نهایی شفاف، محاسبه‌ی لحظه‌ای هزینه‌ها و پشتیبانی کامل تا ترخیص.",
  openGraph: { type: "website", locale: "fa_IR", siteName: "مستقر خودرو" },
};

export const viewport: Viewport = { themeColor: "#070a12", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        {children}
        <Toaster
          position="top-center"
          dir="rtl"
          theme="dark"
          toastOptions={{ style: { fontFamily: "inherit", background: "#131a29", border: "1px solid rgb(255 255 255 / .1)", color: "#eef2fa" } }}
        />
      </body>
    </html>
  );
}
