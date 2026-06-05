"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check, Clock, Zap, Gift, Star } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";
import { useRouter } from "next/navigation";

const PLANS = [
  {
    id: "trial",
    title: "آزمایشی",
    duration: "۷ روز",
    price: 0,
    originalPrice: null,
    popular: false,
    isTrial: true,
    badge: "رایگان",
    badgeColor: "bg-green-600",
  },
  {
    id: "monthly",
    title: "ماهانه",
    duration: "۱ ماه",
    price: 480000,
    originalPrice: null,
    popular: false,
    isTrial: false,
  },
  {
    id: "quarterly",
    title: "سه ماهه",
    duration: "۳ ماه",
    price: 790000,
    originalPrice: 1440000,
    popular: true,
    isTrial: false,
    badge: "پرطرفدار",
    badgeColor: "bg-primary",
  },
  {
    id: "biannual",
    title: "شش ماهه",
    duration: "۶ ماه",
    price: 2016000,
    originalPrice: 2880000,
    popular: false,
    isTrial: false,
  },
  {
    id: "annual",
    title: "سالانه",
    duration: "۱۲ ماه",
    price: 2304000,
    originalPrice: 5760000,
    popular: false,
    isTrial: false,
    badge: "بیشترین صرفه",
    badgeColor: "bg-blue-600",
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [discountCode, setDiscountCode] = useState("");
  const [paying, setPaying] = useState(false);
  const router = useRouter();
  const [isNewUser, setIsNewUser] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  // Check if new user (first 24 hours) for special discount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.user) {
          const created = new Date(d.user.createdAt || Date.now());
          const diff = Date.now() - created.getTime();
          const twentyFourHours = 24 * 60 * 60 * 1000;
          if (diff < twentyFourHours) {
            setIsNewUser(true);
          }
        }
      });
  }, []);

  // Countdown timer for first-purchase discount
  useEffect(() => {
    if (!isNewUser) return;
    const timer = setInterval(() => {
      const stored = localStorage.getItem("first-visit");
      const start = stored ? parseInt(stored) : Date.now();
      if (!stored) localStorage.setItem("first-visit", start.toString());

      const end = start + 24 * 60 * 60 * 1000;
      const remaining = Math.max(0, end - Date.now());

      setTimeLeft({
        hours: Math.floor(remaining / (1000 * 60 * 60)),
        minutes: Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((remaining % (1000 * 60)) / 1000),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isNewUser]);

  const plan = PLANS.find((p) => p.id === selectedPlan);
  const discountMultiplier = isNewUser ? 0.6 : 1; // 40% off for new users
  const finalPrice = plan ? Math.round(plan.price * discountMultiplier) : 0;

  async function handlePurchase() {
    if (!plan) return;
    if (plan.isTrial) {
      // Free trial - activate directly
      setPaying(true);
      try {
        const res = await fetch("/api/payments/trial", { method: "POST" });
        if (res.ok) router.push("/payment/result?status=success&refId=trial");
      } finally { setPaying(false); }
      return;
    }
    setPaying(true);
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "subscription",
          planTitle: plan.title,
          planPrice: finalPrice,
          planDuration: plan.duration,
        }),
      });
      const data = await res.json();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      }
    } finally { setPaying(false); }
  }

  function calcDiscount(original: number | null, current: number) {
    if (!original) return 0;
    return Math.round(((original - current) / original) * 100);
  }

  return (
    <div className="px-4">
      {/* Header */}
      <header className="flex items-center gap-3 pt-6 pb-4">
        <Link href="/"><ArrowRight className="w-6 h-6" /></Link>
        <h1 className="text-lg font-bold">خرید اشتراک</h1>
      </header>

      {/* First-purchase discount banner */}
      {isNewUser && (
        <div className="bg-gradient-to-l from-red-500 to-orange-500 rounded-[var(--radius-card)] p-4 mb-4 text-white animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-5 h-5" />
            <span className="font-bold text-sm">تخفیف ویژه اولین خرید!</span>
          </div>
          <p className="text-xs opacity-90 mb-3">
            ۴۰٪ تخفیف روی تمام پلن‌ها — فقط برای شما
          </p>
          <div className="flex items-center gap-3" dir="ltr">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span className="text-xs">زمان باقیمانده:</span>
            </div>
            <div className="flex gap-1.5 font-mono font-bold text-lg">
              <span className="bg-white/20 rounded px-1.5">{toPersianDigits(timeLeft.hours.toString().padStart(2, "0"))}</span>
              <span>:</span>
              <span className="bg-white/20 rounded px-1.5">{toPersianDigits(timeLeft.minutes.toString().padStart(2, "0"))}</span>
              <span>:</span>
              <span className="bg-white/20 rounded px-1.5">{toPersianDigits(timeLeft.seconds.toString().padStart(2, "0"))}</span>
            </div>
          </div>
        </div>
      )}

      {/* Status */}
      <div className="bg-error/10 text-error text-sm font-medium text-center py-3 rounded-[var(--radius-card)] mb-4">
        بدون اشتراک فعال
      </div>

      {/* Plans */}
      <div className="grid gap-3">
        {PLANS.map((p) => {
          const discount = calcDiscount(p.originalPrice, p.price);
          const isSelected = selectedPlan === p.id;

          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlan(p.id)}
              className={cn(
                "relative flex items-center justify-between p-4 rounded-[var(--radius-card)] border-2 transition-all text-right",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-surface-container bg-white",
                p.isTrial && "border-green-300 bg-green-50/50"
              )}
            >
              {p.badge && (
                <span className={cn("absolute -top-2.5 left-4 text-white text-[10px] font-bold px-3 py-0.5 rounded-full", p.badgeColor)}>
                  {p.badge}
                </span>
              )}

              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  isSelected ? "border-primary" : "border-surface-container"
                )}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm">{p.title}</p>
                    {p.isTrial && <Gift className="w-3.5 h-3.5 text-green-600" />}
                  </div>
                  <p className="text-xs text-on-surface-muted mt-0.5">{p.duration}</p>
                </div>
              </div>

              <div className="text-left">
                {p.isTrial ? (
                  <p className="text-sm font-bold text-green-600">رایگان!</p>
                ) : (
                  <>
                    <p className="text-sm font-bold">
                      {isNewUser ? (
                        <>
                          <span className="text-red-500">{formatPrice(Math.round(p.price * 0.6))}</span>
                        </>
                      ) : (
                        formatPrice(p.price)
                      )}
                    </p>
                    {(p.originalPrice || isNewUser) && (
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-on-surface-muted line-through">
                          {formatPrice(isNewUser ? p.price : p.originalPrice!)}
                        </span>
                        <span className="text-[10px] font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">
                          {isNewUser ? "۴۰٪" : toPersianDigits(discount) + "٪"}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Discount Code */}
      <div className="flex gap-2 mt-4">
        <input
          type="text"
          placeholder="کد تخفیف"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="flex-1 h-11 px-4 text-sm bg-surface-dim rounded-[var(--radius-input)] border border-transparent focus:border-primary focus:outline-none"
        />
        <Button variant="outline" size="sm">اعمال</Button>
      </div>

      {/* Features */}
      <div className="mt-5 bg-surface-dim rounded-[var(--radius-card)] p-4">
        <p className="font-bold text-sm mb-3">با خرید اشتراک:</p>
        {[
          "دسترسی به تمام آموزش‌های ویدئویی",
          "پشتیبانی مستقیم از مربیان",
          "آپدیت‌های رایگان محتوا",
          "امکان پیگیری پیشرفت",
          "تخفیف ویژه فروشگاه تجهیزات",
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-2 py-1.5">
            <Check className="w-4 h-4 text-success shrink-0" />
            <span className="text-sm text-on-surface-muted">{feature}</span>
          </div>
        ))}
      </div>

      {/* Social Proof */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-on-surface-muted">
        <Star className="w-3.5 h-3.5 text-primary" />
        <span>بیش از ۵۰۰ ورزشکار از اسکیتی‌شو استفاده می‌کنند</span>
      </div>

      {/* CTA */}
      <div className="mt-4 pb-6">
        <Button size="full" onClick={handlePurchase} disabled={paying}>
          {plan?.isTrial
            ? "شروع دوره آزمایشی رایگان"
            : paying ? "در حال انتقال..." : `پرداخت ${formatPrice(finalPrice)}`}
        </Button>
      </div>
    </div>
  );
}
