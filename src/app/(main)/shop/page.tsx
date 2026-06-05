"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ShoppingBag, ShoppingCart } from "lucide-react";
import Link from "next/link";
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
}

const categoryLabels: Record<string, string> = {
  INLINE_SKATE: "اسکیت اینلاین",
  SPEED_SKATE: "اسکیت سرعت",
  PROTECTIVE_GEAR: "محافظ",
  WHEELS: "چرخ",
  BEARINGS: "بلبرینگ",
  ACCESSORIES: "لوازم جانبی",
};

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("ALL");

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, []);

  const categories = ["ALL", ...new Set(products.map((p) => p.category))];
  const filtered =
    activeCategory === "ALL"
      ? products
      : products.filter((p) => p.category === activeCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/">
            <ArrowRight className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold">فروشگاه اسکیت</h1>
        </div>
        <Link href="/cart" className="relative">
          <ShoppingCart className="w-6 h-6" />
        </Link>
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
              activeCategory === cat
                ? "bg-primary text-on-surface"
                : "bg-surface-dim text-on-surface-muted"
            )}
          >
            {cat === "ALL" ? "همه" : categoryLabels[cat] || cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <ShoppingBag className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">محصولی یافت نشد</p>
          <p className="text-xs mt-1">به زودی محصولات جدید اضافه می‌شود</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((product) => {
            const discount = product.originalPrice
              ? Math.round(
                  ((product.originalPrice - product.price) /
                    product.originalPrice) *
                    100
                )
              : 0;

            return (
              <Link
                href={`/shop/${product.id}`}
                key={product.id}
                className="bg-white border border-surface-container rounded-[var(--radius-card)] overflow-hidden"
              >
                {/* Image */}
                <div className="aspect-square bg-surface-dim relative">
                  {product.thumbnail ? (
                    <img
                      src={product.thumbnail}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag className="w-8 h-8 text-on-surface-muted/20" />
                    </div>
                  )}
                  {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-error text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {toPersianDigits(discount)}٪
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-xs font-medium leading-relaxed line-clamp-2">
                    {product.title}
                  </h3>
                  {product.brand && (
                    <p className="text-[10px] text-on-surface-muted mt-1">
                      {product.brand}
                    </p>
                  )}
                  <div className="mt-2">
                    <p className="text-sm font-bold">
                      {formatPrice(product.price)}
                    </p>
                    {product.originalPrice && (
                      <p className="text-[10px] text-on-surface-muted line-through">
                        {formatPrice(product.originalPrice)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
