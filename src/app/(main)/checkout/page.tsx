"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, MapPin, Plus, Truck, Check, Tag, X, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { useCartStore } from "@/store/cart";

interface Address {
  id: string;
  title: string;
  province: string;
  city: string;
  address: string;
  postalCode: string | null;
  phone: string | null;
  isDefault: boolean;
}

interface ShippingMethod {
  id: string;
  title: string;
  price: number;
  description: string | null;
  minFreeAmount: number | null;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shippingMethods, setShippingMethods] = useState<ShippingMethod[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [selectedShipping, setSelectedShipping] = useState("");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  // Coupon
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    couponId: string; code: string; discount: number; description: string | null;
  } | null>(null);

  // Address form
  const [showForm, setShowForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (items.length === 0) { router.push("/cart"); return; }

    Promise.all([
      fetch("/api/addresses").then((r) => r.json()),
      fetch("/api/shipping").then((r) => r.json()),
      fetch("/api/wallet").then((r) => r.json()),
    ]).then(([addrData, shipData, walletData]) => {
      const addrs = addrData.addresses || [];
      setAddresses(addrs);
      const def = addrs.find((a: Address) => a.isDefault);
      if (def) setSelectedAddress(def.id);
      else if (addrs.length > 0) setSelectedAddress(addrs[0].id);

      const methods = shipData.methods || [];
      setShippingMethods(methods);
      if (methods.length > 0) setSelectedShipping(methods[0].id);

      setWalletBalance(walletData.balance || 0);
    }).finally(() => setLoading(false));
  }, []);

  async function saveAddress() {
    setSavingAddr(true);
    try {
      const res = await fetch("/api/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addrTitle, province: addrProvince, city: addrCity,
          address: addrAddress, postalCode: addrPostal, phone: addrPhone,
          isDefault: addresses.length === 0,
        }),
      });
      const data = await res.json();
      if (data.address) {
        setAddresses((prev) => [...prev, data.address]);
        setSelectedAddress(data.address.id);
        setShowForm(false);
        setAddrTitle(""); setAddrProvince(""); setAddrCity("");
        setAddrAddress(""); setAddrPostal(""); setAddrPhone("");
      }
    } finally { setSavingAddr(false); }
  }

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, amount: totalPrice(), scope: "SHOP" }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({
          couponId: data.couponId, code: data.code,
          discount: data.discount, description: data.description,
        });
        setCouponError("");
      } else {
        setCouponError(data.error || "کد نامعتبر");
      }
    } catch {
      setCouponError("خطا در بررسی کد");
    } finally { setCouponLoading(false); }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponError("");
  }

  async function handlePay() {
    if (!selectedAddress) return;
    setPaying(true);
    try {
      const walletDeduction = useWallet ? Math.min(walletBalance, grandTotal) : 0;

      const res = await fetch("/api/payments/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "order",
          cartItems: items.map((i) => ({
            productId: i.productId, quantity: i.quantity, price: i.price,
          })),
          addressId: selectedAddress,
          shippingMethod: selectedShipping,
          couponId: appliedCoupon?.couponId,
          useWallet,
          walletDeduction,
        }),
      });
      const data = await res.json();
      if (data.paidByWallet) {
        clearCart();
        router.push("/payment/result?status=success&wallet=1");
      } else if (data.payUrl) {
        clearCart();
        window.location.href = data.payUrl;
      }
    } finally { setPaying(false); }
  }

  const itemsTotal = totalPrice();
  const shipping = shippingMethods.find((s) => s.id === selectedShipping);
  const isFreeShipping = shipping?.minFreeAmount ? itemsTotal >= shipping.minFreeAmount : false;
  const shippingPrice = shipping ? (isFreeShipping ? 0 : shipping.price) : 0;
  const discount = appliedCoupon?.discount || 0;
  const grandTotal = itemsTotal + shippingPrice - discount;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-40">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}><ArrowRight className="w-5 h-5" /></button>
        <h1 className="text-lg font-bold">تکمیل سفارش</h1>
      </div>

      {/* Address */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">آدرس ارسال</h2>
          <button onClick={() => setShowForm(true)} className="text-xs text-primary font-medium flex items-center gap-1">
            <Plus className="w-3 h-3" /> آدرس جدید
          </button>
        </div>
        {addresses.length > 0 ? (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <button key={addr.id} onClick={() => setSelectedAddress(addr.id)}
                className={`w-full text-right flex items-start gap-3 p-3 rounded-xl border-2 transition-colors ${
                  selectedAddress === addr.id ? "border-primary bg-primary/5" : "border-surface-container"
                }`}>
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${selectedAddress === addr.id ? "text-primary" : "text-on-surface-muted"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{addr.title}</p>
                  <p className="text-[11px] text-on-surface-muted mt-0.5">{addr.province}، {addr.city}، {addr.address}</p>
                </div>
                {selectedAddress === addr.id && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-xs text-on-surface-muted text-center py-4">لطفاً یک آدرس اضافه کنید</p>
        )}
        {showForm && (
          <div className="mt-3 pt-3 border-t border-surface-container space-y-2">
            <input type="text" placeholder="عنوان (مثلاً: خانه)" value={addrTitle}
              onChange={(e) => setAddrTitle(e.target.value)}
              className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="استان" value={addrProvince} onChange={(e) => setAddrProvince(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="text" placeholder="شهر" value={addrCity} onChange={(e) => setAddrCity(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <textarea placeholder="آدرس کامل" value={addrAddress} onChange={(e) => setAddrAddress(e.target.value)} rows={2}
              className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="کد پستی" value={addrPostal} onChange={(e) => setAddrPostal(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="text" placeholder="تلفن تماس" value={addrPhone} onChange={(e) => setAddrPhone(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2">
              <Button size="full" onClick={saveAddress}
                disabled={!addrTitle || !addrProvince || !addrCity || !addrAddress || savingAddr}>
                {savingAddr ? "ذخیره..." : "ذخیره آدرس"}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>انصراف</Button>
            </div>
          </div>
        )}
      </div>

      {/* Shipping */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <h2 className="text-sm font-bold mb-3">نحوه ارسال</h2>
        <div className="space-y-2">
          {shippingMethods.map((s) => {
            const isFree = s.minFreeAmount ? itemsTotal >= s.minFreeAmount : false;
            return (
              <button key={s.id} onClick={() => setSelectedShipping(s.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                  selectedShipping === s.id ? "border-primary bg-primary/5" : "border-surface-container"
                }`}>
                <Truck className={`w-5 h-5 shrink-0 ${selectedShipping === s.id ? "text-primary" : "text-on-surface-muted"}`} />
                <div className="flex-1 text-right">
                  <p className="text-sm font-medium">{s.title}</p>
                  {s.description && <p className="text-[11px] text-on-surface-muted">{s.description}</p>}
                </div>
                <p className="text-sm font-bold shrink-0">
                  {isFree
                    ? <span className="text-green-600">رایگان!</span>
                    : formatPrice(s.price)
                  }
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coupon */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <h2 className="text-sm font-bold mb-3">کد تخفیف</h2>
        {appliedCoupon ? (
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-green-600" />
              <div>
                <p className="text-xs font-bold text-green-700">{appliedCoupon.code}</p>
                <p className="text-[10px] text-green-600">{formatPrice(appliedCoupon.discount)} تخفیف</p>
              </div>
            </div>
            <button onClick={removeCoupon} className="text-on-surface-muted"><X className="w-4 h-4" /></button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input type="text" placeholder="کد تخفیف را وارد کنید" value={couponCode}
                onChange={(e) => { setCouponCode(e.target.value); setCouponError(""); }}
                className="flex-1 border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary"
                dir="ltr" />
              <Button variant="secondary" onClick={applyCoupon} disabled={couponLoading || !couponCode.trim()}>
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "اعمال"}
              </Button>
            </div>
            {couponError && <p className="text-xs text-error mt-2">{couponError}</p>}
          </div>
        )}
      </div>

      {/* Wallet */}
      {walletBalance > 0 && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-bold">پرداخت از کیف پول</p>
              <p className="text-xs text-on-surface-muted mt-0.5">
                موجودی: {formatPrice(walletBalance)}
              </p>
            </div>
            <div className={`w-11 h-6 rounded-full transition-colors relative ${useWallet ? "bg-primary" : "bg-gray-300"}`}
              onClick={() => setUseWallet(!useWallet)}>
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${useWallet ? "left-5" : "left-0.5"}`} />
            </div>
          </label>
          {useWallet && (
            <p className="text-xs text-primary mt-2 font-medium">
              {walletBalance >= grandTotal
                ? "کل مبلغ از کیف پول پرداخت میشه"
                : `${formatPrice(Math.min(walletBalance, grandTotal))} از کیف پول + ${formatPrice(grandTotal - Math.min(walletBalance, grandTotal))} از درگاه`}
            </p>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <h2 className="text-sm font-bold mb-3">خلاصه سفارش</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <span className="text-on-surface-muted">{item.title} × {toPersianDigits(item.quantity)}</span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-surface-container pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-muted">جمع محصولات</span>
              <span>{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-muted">هزینه ارسال</span>
              <span>{isFreeShipping ? <span className="text-green-600">رایگان!</span> : formatPrice(shippingPrice)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>تخفیف</span>
                <span>−{formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold pt-2 border-t border-surface-container">
              <span>جمع کل</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-surface-container p-4 max-w-lg mx-auto">
        <Button size="full" disabled={!selectedAddress || paying} onClick={handlePay}>
          {paying ? "در حال انتقال به درگاه..." : `پرداخت ${formatPrice(grandTotal)}`}
        </Button>
      </div>
    </div>
  );
}