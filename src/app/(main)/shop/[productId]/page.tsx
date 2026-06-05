"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, ShoppingCart, Check, ShoppingBag,
  Minus, Plus, Star, Truck, Shield,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits, cn } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  thumbnail: string | null;
  category: string;
  brand: string | null;
  inStock: boolean;
}

const categoryLabels: Record<string, string> = {
  INLINE_SKATE: "اسکیت اینلاین",
  SPEED_SKATE: "اسکیت سرعت",
  PROTECTIVE_GEAR: "محافظ",
  WHEELS: "چرخ",
  BEARINGS: "بلبرینگ",
  ACCESSORIES: "لوازم جانبی",
};

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const { addItem, items } = useCartStore();
  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product);
        setRelated(d.related || []);
      })
      .finally(() => setLoading(false));
  }, [productId]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      brand: product.brand,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-on-surface-muted">محصول یافت نشد</p>
        <Button variant="outline" onClick={() => router.push("/shop")}>بازگشت</Button>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <div className="pb-28">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-6 pb-3">
        <Link href="/shop"><ArrowRight className="w-6 h-6" /></Link>
        <Link href="/cart" className="relative">
          <ShoppingCart className="w-6 h-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -left-2 w-5 h-5 bg-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {toPersianDigits(cartCount)}
            </span>
          )}
        </Link>
      </div>

      {/* Image */}
      <div className="aspect-square bg-surface-dim mx-4 rounded-[var(--radius-card)] overflow-hidden mb-4">
        {product.thumbnail ? (
          <img src={product.thumbnail} alt={product.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-16 h-16 text-on-surface-muted/20" />
          </div>
        )}
      </div>

      <div className="px-4">
        {/* Category & Brand */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-surface-dim text-on-surface-muted px-2 py-0.5 rounded-full">
            {categoryLabels[product.category] || product.category}
          </span>
          {product.brand && (
            <span className="text-xs text-on-surface-muted">{product.brand}</span>
          )}
        </div>

        {/* Title */}
        <h1 className="text-lg font-bold leading-relaxed mb-3">{product.title}</h1>

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold">{formatPrice(product.price)}</span>
          {product.originalPrice && (
            <>
              <span className="text-sm text-on-surface-muted line-through">
                {formatPrice(product.originalPrice)}
              </span>
              <span className="bg-error text-white text-xs font-bold px-2 py-0.5 rounded">
                {toPersianDigits(discount)}٪ تخفیف
              </span>
            </>
          )}
        </div>

        {/* Stock Status */}
        <div className={cn(
          "flex items-center gap-2 text-sm mb-4",
          product.inStock ? "text-success" : "text-error"
        )}>
          {product.inStock ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          {product.inStock ? "موجود در انبار" : "ناموجود"}
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { icon: Truck, label: "ارسال سریع" },
            { icon: Shield, label: "ضمانت اصالت" },
            { icon: Star, label: "کیفیت تضمینی" },
          ].map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-1.5 bg-surface-dim rounded-xl p-3">
              <f.icon className="w-4.5 h-4.5 text-primary" />
              <span className="text-[10px] text-on-surface-muted">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Description */}
        {product.description && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-2">توضیحات محصول</h2>
            <p className="text-sm text-on-surface-muted leading-relaxed">{product.description}</p>
          </div>
        )}

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3">محصولات مشابه</h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
              {related.map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${p.id}`}
                  className="shrink-0 w-36 bg-white border border-surface-container rounded-[var(--radius-card)] overflow-hidden"
                >
                  <div className="aspect-square bg-surface-dim flex items-center justify-center">
                    <ShoppingBag className="w-6 h-6 text-on-surface-muted/20" />
                  </div>
                  <div className="p-2">
                    <p className="text-[11px] font-medium line-clamp-2">{p.title}</p>
                    <p className="text-xs font-bold mt-1">{formatPrice(p.price)}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-container p-4 max-w-lg mx-auto">
        <Button
          size="full"
          disabled={!product.inStock}
          onClick={handleAddToCart}
          className={added ? "bg-success hover:bg-success" : ""}
        >
          {added ? (
            <>
              <Check className="w-4 h-4 ml-2" />
              اضافه شد!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 ml-2" />
              افزودن به سبد خرید
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
