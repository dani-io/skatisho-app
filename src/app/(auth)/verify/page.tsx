"use client";

import { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

function VerifyForm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(120);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all filled
    if (newOtp.every((d) => d !== "")) {
      handleVerify(newOtp.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerify(code: string) {
    setLoading(true);
    try {
      // TODO: Call API to verify OTP
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user?.isNew) {
          router.push("/onboarding");
        } else {
          router.push("/app");
        }
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="flex flex-col min-h-full px-6">
      {/* Back button */}
      <Link href="/login" className="pt-6 self-end">
        <ArrowRight className="w-6 h-6 text-on-surface" />
      </Link>

      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-xl font-bold mb-2">کد تأیید را وارد کنید</h1>
        <p className="text-sm text-on-surface-muted mb-8">
          کد ارسال‌شده به {toPersianDigits(phone)} را وارد کنید
        </p>

        {/* OTP Inputs */}
        <div className="flex gap-3 mb-6" dir="ltr">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold bg-surface-dim rounded-[var(--radius-input)] border border-transparent focus:border-primary focus:outline-none transition-colors"
            />
          ))}
        </div>

        {/* Countdown */}
        {countdown > 0 ? (
          <p className="text-sm text-on-surface-muted">
            ارسال مجدد تا{" "}
            <span className="font-bold text-primary">
              {toPersianDigits(minutes)}:{toPersianDigits(seconds.toString().padStart(2, "0"))}
            </span>
          </p>
        ) : (
          <button
            onClick={() => setCountdown(120)}
            className="text-sm text-primary font-medium"
          >
            ارسال مجدد کد
          </button>
        )}
      </div>

      <div className="pb-10">
        <Button
          size="full"
          disabled={otp.some((d) => d === "") || loading}
          onClick={() => handleVerify(otp.join(""))}
        >
          {loading ? "در حال بررسی..." : "تأیید و ورود"}
        </Button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
