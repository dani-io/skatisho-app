import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ServiceWorkerRegister } from "@/components/layout/sw-register";

export const metadata: Metadata = {
  title: "اسکیتی‌شو | دستیار تمرین اسکیت",
  description:
    "اولین اپلیکیشن ایرانی آموزش اسکیت. آموزش مرحله‌به‌مرحله با مربیان حرفه‌ای.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "اسکیتی‌شو",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#F5B800",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full">
      <body className="h-full font-sans antialiased">
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
