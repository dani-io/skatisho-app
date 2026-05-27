"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Copy, Check, Gift, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/utils";

export default function ReferralPage() {
  const [code, setCode] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setCode(d.user?.referralCode || ""));
  }, []);

  async function handleCopy() {
    const text = `اسکیتی‌شو رو نصب کن و با کد معرف من ثبت‌نام کن:\n${code}\n\nhttps://app.skatisho.com`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleShare() {
    if (navigator.share) {
      await navigator.share({
        title: "اسکیتی‌شو",
        text: `با اسکیتی‌شو اسکیت یاد بگیر! کد معرف من: ${code}`,
        url: "https://app.skatisho.com",
      });
    } else {
      handleCopy();
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/"><ArrowRight className="w-6 h-6" /></Link>
        <h1 className="text-lg font-bold">معرفی به دوستان</h1>
      </div>

      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Gift className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-bold mb-2">دوستاتو دعوت کن!</h2>
        <p className="text-sm text-on-surface-muted leading-relaxed">
          با هر دعوت موفق، هم تو و هم دوستت اعتبار هدیه دریافت می‌کنید
        </p>
      </div>

      {/* Code */}
      <div className="bg-surface-dim rounded-[var(--radius-card)] p-5 mb-4">
        <p className="text-xs text-on-surface-muted text-center mb-3">کد معرف شما</p>
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl font-bold tracking-widest" dir="ltr">{code}</span>
          <button
            onClick={handleCopy}
            className="w-10 h-10 rounded-xl bg-white border border-surface-container flex items-center justify-center"
          >
            {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-on-surface-muted" />}
          </button>
        </div>
      </div>

      <Button size="full" onClick={handleShare} className="mb-8">
        اشتراک‌گذاری با دوستان
      </Button>

      {/* How it works */}
      <div className="space-y-4">
        <h3 className="font-bold text-sm">چطور کار می‌کنه؟</h3>
        {[
          { icon: Copy, text: "کد معرف خودت رو کپی یا اشتراک‌گذاری کن" },
          { icon: Users, text: "دوستت با کد تو ثبت‌نام می‌کنه" },
          { icon: Wallet, text: "هر دوتاتون اعتبار هدیه دریافت می‌کنید" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-4 bg-surface-dim rounded-[var(--radius-card)] p-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shrink-0">
              {toPersianDigits(i + 1)}
            </div>
            <p className="text-sm">{step.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
