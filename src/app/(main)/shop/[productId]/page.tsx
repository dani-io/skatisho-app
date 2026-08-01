"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, ShoppingCart, Check, ShoppingBag,
  Star, Truck, Shield,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits, cn } from "@/lib/utils";
import { cdnUrl } from "@/lib/storage";
import { useCartStore } from "@/store/cart";

interface OptionValue {
  label: string;
  color?: string;
  priceAdjust: number;
}

interface ProductOption {
  name: string;
  type: "color" | "select";
  values: OptionValue[];
}

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
  customizable: boolean;
  options: ProductOption[] | null;
  images: string[];
}

const categoryLabels: Record<string, string> = {
  INLINE_SKATE: "اسکیت اینلاین", SPEED_SKATE: "اسکیت سرعت",
  PROTECTIVE_GEAR: "محافظ", WHEELS: "چرخ",
  BEARINGS: "بلبرینگ", ACCESSORIES: "لوازم جانبی",
};

export default function ProductDetailPage() {
  const { productId } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const { addItem, items } = useCartStore();
  const cartCount = items.reduce((acc, i) => acc + i.quantity, 0);
  const [activeImg, setActiveImg] = useState(0);

  useEffect(() => {
    fetch(`/api/products/${productId}`)
      .then((r) => r.json())
      .then((d) => {
        setProduct(d.product);
        setRelated(d.related || []);
        const [activeImg, setActiveImg] = useState(0);
        // Set default selections
        if (d.product?.options) {
          const defaults: Record<string, string> = {};
          d.product.options.forEach((opt: ProductOption) => {
            if (opt.values.length > 0) defaults[opt.name] = opt.values[0].label;
          });
          setSelections(defaults);
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  function getPriceAdjust(): number {
    if (!product?.options) return 0;
    let adjust = 0;
    product.options.forEach((opt) => {
      const selected = selections[opt.name];
      const val = opt.values.find((v) => v.label === selected);
      if (val) adjust += val.priceAdjust;
    });
    return adjust;
  }

  function allOptionsSelected(): boolean {
    if (!product?.customizable || !product.options) return true;
    return product.options.every((opt) => selections[opt.name]);
  }

  function handleAddToCart() {
    if (!product || !allOptionsSelected()) return;
    const priceAdjust = getPriceAdjust();
    addItem({
      productId: product.id,
      title: product.title,
      price: product.price + priceAdjust,
      thumbnail: product.thumbnail,
      brand: product.brand,
      selectedOptions: product.customizable ? selections : undefined,
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

  const priceAdjust = getPriceAdjust();
  const finalPrice = product.price + priceAdjust;
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;
  // thumbnail is already absolutised by the API; the gallery keys are not.
  const allImages = [
    ...(product.thumbnail ? [product.thumbnail] : []),
    ...(product.images || []).map((img: string) => cdnUrl(img)),
  ];
  
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

      {/* Image Gallery */}
      <div className="mx-4 mb-4">
        <div className="aspect-square bg-surface-dim rounded-[var(--radius-card)] overflow-hidden relative">
          {allImages.length > 0 ? (
            <img src={allImages[activeImg]} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="w-16 h-16 text-on-surface-muted/20" />
            </div>
          )}
        </div>
        {allImages.length > 1 && (
          <div className="flex gap-2 mt-2 overflow-x-auto">
            {allImages.map((img, i) => (
              <button key={i} onClick={() => setActiveImg(i)}
                className={`w-14 h-14 rounded-lg overflow-hidden shrink-0 border-2 transition-colors ${
                  i === activeImg ? "border-primary" : "border-transparent"
                }`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="px-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-surface-dim text-on-surface-muted px-2 py-0.5 rounded-full">
            {categoryLabels[product.category] || product.category}
          </span>
          {product.brand && <span className="text-xs text-on-surface-muted">{product.brand}</span>}
          {product.customizable && (
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">سفارشی</span>
          )}
        </div>

        <h1 className="text-lg font-bold leading-relaxed mb-3">{product.title}</h1>

        {/* Price */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl font-bold">{formatPrice(finalPrice)}</span>
          {(product.originalPrice || priceAdjust > 0) && (
            <span className="text-sm text-on-surface-muted line-through">
              {formatPrice(product.originalPrice || product.price)}
            </span>
          )}
          {discount > 0 && !priceAdjust && (
            <span className="bg-error text-white text-xs font-bold px-2 py-0.5 rounded">
              {toPersianDigits(discount)}٪ تخفیف
            </span>
          )}
        </div>

        {/* Custom Options */}
        {product.customizable && product.options && (
          <div className="space-y-4 mb-6 p-4 bg-surface-dim rounded-[var(--radius-card)]">
            {product.options.map((opt) => (
              <div key={opt.name}>
                <p className="text-sm font-bold mb-2">{opt.name}</p>
                {opt.type === "color" ? (
                  <div className="flex gap-2 flex-wrap">
                    {opt.values.map((v) => (
                      <button key={v.label} onClick={() => setSelections((p) => ({ ...p, [opt.name]: v.label }))}
                        className={`w-10 h-10 rounded-full border-3 transition-all ${
                          selections[opt.name] === v.label ? "border-primary scale-110 shadow-md" : "border-transparent"
                        }`}
                        style={{ backgroundColor: v.color || "#ccc" }}
                        title={`${v.label}${v.priceAdjust ? ` (+${formatPrice(v.priceAdjust)})` : ""}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex gap-2 flex-wrap">
                    {opt.values.map((v) => (
                      <button key={v.label} onClick={() => setSelections((p) => ({ ...p, [opt.name]: v.label }))}
                        className={`px-4 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${
                          selections[opt.name] === v.label
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-surface-container bg-white"
                        }`}>
                        {v.label}
                        {v.priceAdjust > 0 && (
                          <span className="text-[9px] text-on-surface-muted block">+{formatPrice(v.priceAdjust)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {priceAdjust > 0 && (
              <p className="text-xs text-primary font-medium pt-2 border-t border-surface-container">
                هزینه اضافی گزینه‌ها: +{formatPrice(priceAdjust)}
              </p>
            )}
          </div>
        )}

        {/* Stock */}
        <div className={cn("flex items-center gap-2 text-sm mb-4", product.inStock ? "text-success" : "text-error")}>
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

        {product.description && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-2">توضیحات محصول</h2>
            <p className="text-sm text-on-surface-muted leading-relaxed">{product.description}</p>
          </div>
        )}

        {related.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold text-sm mb-3">محصولات مشابه</h2>
            <div className="flex gap-3 overflow-x-auto -mx-4 px-4 pb-2">
              {related.map((p) => (
                <Link key={p.id} href={`/shop/${p.id}`}
                  className="shrink-0 w-36 bg-white border border-surface-container rounded-[var(--radius-card)] overflow-hidden">
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

      {/* Fixed CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-surface-container p-4 max-w-lg mx-auto">
        <Button size="full" disabled={!product.inStock || !allOptionsSelected()}
          onClick={handleAddToCart}
          className={added ? "bg-success hover:bg-success" : ""}>
          {added ? (
            <><Check className="w-4 h-4 ml-2" /> اضافه شد!</>
          ) : !allOptionsSelected() ? (
            "لطفاً گزینه‌ها را انتخاب کنید"
          ) : (
            <><ShoppingCart className="w-4 h-4 ml-2" /> افزودن به سبد — {formatPrice(finalPrice)}</>
          )}
        </Button>
      </div>
    </div>
  );
}
