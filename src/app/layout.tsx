import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: { default: "گاراژ | واردات خودرو از امارات، از چابهار تا سراسر ایران", template: "%s | گاراژ" },
  description: "خرید و واردات خودرو از امارات با قیمت نهایی شفاف، محاسبه‌ی لحظه‌ای هزینه‌ها و پشتیبانی کامل تا ترخیص؛ از مجموعه‌ی گاراژ.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "گاراژ" },
  openGraph: { type: "website", locale: "fa_IR", siteName: "گاراژ" },
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
    other: [
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: "#070a12",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" data-scroll-behavior="smooth" suppressHydrationWarning>
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
