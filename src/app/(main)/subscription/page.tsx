"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, formatPrice, toPersianDigits } from "@/lib/utils";

// TODO: Fetch from API
const PLANS = [
  {
    id: "monthly",
    title: "ماهانه",
    duration: "۱ ماه",
    price: 480000,
    originalPrice: null,
    popular: false,
  },
  {
    id: "quarterly",
    title: "سه ماهه",
    duration: "۳ ماه",
    price: 790000,
    originalPrice: 1440000,
    popular: true,
  },
  {
    id: "biannual",
    title: "شش ماهه",
    duration: "۶ ماه",
    price: 2016000,
    originalPrice: 2880000,
    popular: false,
  },
  {
    id: "annual",
    title: "سالانه",
    duration: "۱۲ ماه",
    price: 2304000,
    originalPrice: 5760000,
    popular: false,
  },
];

export default function SubscriptionPage() {
  const [selectedPlan, setSelectedPlan] = useState("quarterly");
  const [discountCode, setDiscountCode] = useState("");

  const plan = PLANS.find((p) => p.id === selectedPlan);

  function calcDiscount(original: number | null, current: number) {
    if (!original) return 0;
    return Math.round(((original - current) / original) * 100);
  }

  return (
    <div className="px-4">
      {/* Header */}
      <header className="flex items-center gap-3 pt-6 pb-4">
        <Link href="/">
          <ArrowRight className="w-6 h-6" />
        </Link>
        <h1 className="text-lg font-bold">خرید اشتراک</h1>
      </header>

      {/* Status */}
      <div className="bg-error/10 text-error text-sm font-medium text-center py-3 rounded-[var(--radius-card)] mb-6">
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
                  ? "border-primary bg-primary/5"
                  : "border-surface-container bg-white"
              )}
            >
              {/* Popular badge */}
              {p.popular && (
                <span className="absolute -top-2.5 left-4 bg-primary text-xs font-bold px-3 py-0.5 rounded-full">
                  پرطرفدار
                </span>
              )}

              <div className="flex items-center gap-3">
                {/* Radio */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-primary" : "border-surface-container"
                  )}
                >
                  {isSelected && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                  )}
                </div>

                <div>
                  <p className="font-bold text-sm">{p.title}</p>
                  <p className="text-xs text-on-surface-muted mt-0.5">
                    {p.duration}
                  </p>
                </div>
              </div>

              <div className="text-left">
                <p className="font-bold text-sm">{formatPrice(p.price)}</p>
                {p.originalPrice && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-on-surface-muted line-through">
                      {formatPrice(p.originalPrice)}
                    </span>
                    <span className="text-xs font-bold text-error bg-error/10 px-1.5 py-0.5 rounded">
                      {toPersianDigits(discount)}٪
                    </span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Discount Code */}
      <div className="flex gap-2 mt-6">
        <input
          type="text"
          placeholder="کد تخفیف"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          className="flex-1 h-11 px-4 text-sm bg-surface-dim rounded-[var(--radius-input)] border border-transparent focus:border-primary focus:outline-none"
        />
        <Button variant="outline" size="sm">
          اعمال
        </Button>
      </div>

      {/* Features */}
      <div className="mt-6 bg-surface-dim rounded-[var(--radius-card)] p-4">
        <p className="font-bold text-sm mb-3">با خرید اشتراک:</p>
        {[
          "دسترسی به تمام آموزش‌های ویدئویی",
          "پشتیبانی مستقیم از مربیان",
          "آپدیت‌های رایگان محتوا",
          "امکان پیگیری پیشرفت",
        ].map((feature) => (
          <div key={feature} className="flex items-center gap-2 py-1.5">
            <Check className="w-4 h-4 text-success shrink-0" />
            <span className="text-sm text-on-surface-muted">{feature}</span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 pb-6">
        <Button size="full">
          پرداخت {plan ? formatPrice(plan.price) : ""}
        </Button>
      </div>
    </div>
  );
}
