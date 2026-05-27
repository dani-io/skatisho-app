"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.length < 11) return;

    setLoading(true);
    try {
      // TODO: Call API to send OTP
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      if (res.ok) {
        router.push(`/verify?phone=${phone}`);
      }
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full px-6">
      {/* Logo */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-28 h-28 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <img
            src="/icons/logo.svg"
            alt="اسکیتی‌شو"
            className="w-16 h-16"
          />
        </div>
        <h1 className="text-2xl font-bold mb-2">اسکیتی‌شو</h1>
        <p className="text-on-surface-muted text-sm">
          دستیار تمرین مربیان و ورزشکاران اسکیت
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="pb-10">
        <label className="block text-sm font-medium mb-2">
          شماره تلفن همراه
        </label>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="۰۹۱۲۳۴۵۶۷۸۹"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
          maxLength={11}
          className="w-full h-13 px-4 text-lg text-center tracking-widest bg-surface-dim rounded-[var(--radius-input)] border border-transparent focus:border-primary focus:outline-none transition-colors placeholder:text-on-surface-muted/40"
          dir="ltr"
        />

        <Button
          type="submit"
          size="full"
          disabled={phone.length < 11 || loading}
          className="mt-4"
        >
          {loading ? "در حال ارسال..." : "دریافت کد تأیید"}
        </Button>

        <p className="text-xs text-on-surface-muted text-center mt-4">
          با ورود به اسکیتی‌شو،{" "}
          <span className="text-primary">قوانین و مقررات</span> را می‌پذیرید.
        </p>
      </form>
    </div>
  );
}
