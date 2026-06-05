"use client";
import { useState } from "react";

import { ArrowRight, Minus, Plus, Trash2, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

export default function CartPage() {
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCartStore();
  const [paying, setPaying] = useState(false);

  async function handleCheckout() {
    setPaying(true);
    try {
      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order",
          cartItems: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            price: i.price,
          })),
        }),
      });
      const data = await res.json();
      if (data.payUrl) {
        clearCart();
        window.location.href = data.payUrl;
      }
    } finally { setPaying(false); }
  }

  if (items.length === 0) {
    return (
      <div className="px-4 pt-6">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/shop"><ArrowRight className="w-6 h-6" /></Link>
          <h1 className="text-lg font-bold">سبد خرید</h1>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <ShoppingCart className="w-16 h-16 text-on-surface-muted/20 mb-4" />
          <p className="font-bold text-lg mb-2">سبد خرید خالیه!</p>
          <p className="text-sm text-on-surface-muted mb-6">
            از فروشگاه محصولات مورد نظرت رو اضافه کن
          </p>
          <Link href="/shop">
            <Button>رفتن به فروشگاه</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-40">
      <div className="px-4 pt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/shop"><ArrowRight className="w-6 h-6" /></Link>
            <h1 className="text-lg font-bold">
              سبد خرید
              <span className="text-sm font-normal text-on-surface-muted mr-2">
                ({toPersianDigits(items.length)} محصول)
              </span>
            </h1>
          </div>
          <button
            onClick={clearCart}
            className="text-xs text-error hover:bg-error/5 px-3 py-1.5 rounded-lg"
          >
            حذف همه
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white border border-surface-container rounded-[var(--radius-card)] p-4"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="w-20 h-20 bg-surface-dim rounded-xl overflow-hidden shrink-0">
                  {item.thumbnail ? (
                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-6 h-6 text-on-surface-muted/20" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium leading-relaxed line-clamp-2">
                    {item.title}
                  </h3>
                  {item.brand && (
                    <p className="text-xs text-on-surface-muted mt-0.5">{item.brand}</p>
                  )}
                  <p className="text-sm font-bold mt-2">{formatPrice(item.price)}</p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => removeItem(item.productId)}
                  className="self-start p-1.5 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-end gap-3 mt-3 pt-3 border-t border-surface-container">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-8 h-8 rounded-lg bg-surface-dim flex items-center justify-center hover:bg-surface-container"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-sm font-bold w-6 text-center">
                  {toPersianDigits(item.quantity)}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center hover:bg-primary/20"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom - Order Summary */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-container max-w-lg mx-auto">
        <div className="px-4 py-3 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-muted">جمع سبد خرید</span>
            <span className="font-bold">{formatPrice(totalPrice())}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-on-surface-muted">هزینه ارسال</span>
            <span className="text-success text-xs">پس از ثبت سفارش محاسبه می‌شود</span>
          </div>
          <Button size="full" className="mt-2" onClick={handleCheckout} disabled={paying}>
            {paying ? "در حال انتقال به درگاه..." : `ثبت سفارش — ${formatPrice(totalPrice())}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
