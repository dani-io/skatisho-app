"use client";

import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";
import { Suspense } from "react";

function PaymentResultContent() {
  const params = useSearchParams();
  const status = params.get("status");
  const refId = params.get("refId");

  const config: Record<string, { icon: typeof CheckCircle; title: string; message: string; color: string }> = {
    success: {
      icon: CheckCircle,
      title: "پرداخت موفق!",
      message: "تراکنش شما با موفقیت انجام شد",
      color: "text-green-500",
    },
    failed: {
      icon: XCircle,
      title: "پرداخت ناموفق",
      message: "متأسفانه پرداخت انجام نشد. لطفاً دوباره تلاش کنید",
      color: "text-red-500",
    },
    cancelled: {
      icon: AlertCircle,
      title: "پرداخت لغو شد",
      message: "شما پرداخت را لغو کردید",
      color: "text-amber-500",
    },
    error: {
      icon: XCircle,
      title: "خطا",
      message: "مشکلی در پردازش پرداخت رخ داد",
      color: "text-red-500",
    },
  };

  const info = config[status || "error"] || config.error;
  const Icon = info.icon;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <Icon className={`w-20 h-20 mb-6 ${info.color}`} />
      <h1 className="text-xl font-bold mb-2">{info.title}</h1>
      <p className="text-sm text-on-surface-muted mb-4">{info.message}</p>

      {refId && (
        <div className="bg-surface-dim rounded-xl px-6 py-3 mb-6">
          <p className="text-[11px] text-on-surface-muted mb-1">کد پیگیری</p>
          <p className="text-lg font-bold" dir="ltr">{toPersianDigits(refId)}</p>
        </div>
      )}

      <div className="flex gap-3 w-full max-w-xs">
        <Link href="/" className="flex-1">
          <Button size="full" variant="secondary">صفحه اصلی</Button>
        </Link>
        {status !== "success" && (
          <Link href="/subscription" className="flex-1">
            <Button size="full">تلاش مجدد</Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function PaymentResultPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <PaymentResultContent />
    </Suspense>
  );
}
