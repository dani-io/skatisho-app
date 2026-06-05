"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  Plus,
  Truck,
  Package,
  Check,
  ChevronLeft,
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

const SHIPPING_METHODS = [
  { id: "post", label: "پست پیشتاز", price: 150000, days: "۳ تا ۵ روز کاری", icon: Truck },
  { id: "express", label: "ارسال اکسپرس", price: 350000, days: "۱ تا ۲ روز کاری", icon: Package },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, totalPrice, clearCart } = useCartStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [selectedShipping, setSelectedShipping] = useState("post");
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(false);

  // New address form
  const [showForm, setShowForm] = useState(false);
  const [addrTitle, setAddrTitle] = useState("");
  const [addrProvince, setAddrProvince] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrAddress, setAddrAddress] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const [addrPhone, setAddrPhone] = useState("");
  const [savingAddr, setSavingAddr] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      router.push("/cart");
      return;
    }
    fetch("/api/addresses")
      .then((r) => r.json())
      .then((data) => {
        const addrs = data.addresses || [];
        setAddresses(addrs);
        const def = addrs.find((a: Address) => a.isDefault);
        if (def) setSelectedAddress(def.id);
        else if (addrs.length > 0) setSelectedAddress(addrs[0].id);
      })
      .finally(() => setLoading(false));
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

  async function handlePay() {
    if (!selectedAddress) return;
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
          addressId: selectedAddress,
          shippingMethod: selectedShipping,
        }),
      });
      const data = await res.json();
      if (data.payUrl) {
        clearCart();
        window.location.href = data.payUrl;
      }
    } finally { setPaying(false); }
  }

  const shipping = SHIPPING_METHODS.find((s) => s.id === selectedShipping)!;
  const itemsTotal = totalPrice();
  const grandTotal = itemsTotal + shipping.price;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-40">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">تکمیل سفارش</h1>
      </div>

      {/* Address Selection */}
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
              <button
                key={addr.id}
                onClick={() => setSelectedAddress(addr.id)}
                className={`w-full text-right flex items-start gap-3 p-3 rounded-xl border-2 transition-colors ${
                  selectedAddress === addr.id
                    ? "border-primary bg-primary/5"
                    : "border-surface-container"
                }`}
              >
                <MapPin className={`w-4 h-4 mt-0.5 shrink-0 ${selectedAddress === addr.id ? "text-primary" : "text-on-surface-muted"}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{addr.title}</p>
                  <p className="text-[11px] text-on-surface-muted mt-0.5">
                    {addr.province}، {addr.city}، {addr.address}
                  </p>
                  {addr.phone && <p className="text-[10px] text-on-surface-muted mt-0.5" dir="ltr">{addr.phone}</p>}
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
          <p className="text-xs text-on-surface-muted text-center py-4">
            لطفاً یک آدرس اضافه کنید
          </p>
        )}

        {/* Inline Address Form */}
        {showForm && (
          <div className="mt-3 pt-3 border-t border-surface-container space-y-2">
            <input type="text" placeholder="عنوان (مثلاً: خانه)" value={addrTitle}
              onChange={(e) => setAddrTitle(e.target.value)}
              className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="استان" value={addrProvince}
                onChange={(e) => setAddrProvince(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="text" placeholder="شهر" value={addrCity}
                onChange={(e) => setAddrCity(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <textarea placeholder="آدرس کامل" value={addrAddress}
              onChange={(e) => setAddrAddress(e.target.value)} rows={2}
              className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary" />
            <div className="grid grid-cols-2 gap-2">
              <input type="text" placeholder="کد پستی" value={addrPostal}
                onChange={(e) => setAddrPostal(e.target.value)}
                className="border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              <input type="text" placeholder="تلفن تماس" value={addrPhone}
                onChange={(e) => setAddrPhone(e.target.value)}
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

      {/* Shipping Method */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <h2 className="text-sm font-bold mb-3">نحوه ارسال</h2>
        <div className="space-y-2">
          {SHIPPING_METHODS.map((method) => (
            <button
              key={method.id}
              onClick={() => setSelectedShipping(method.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                selectedShipping === method.id
                  ? "border-primary bg-primary/5"
                  : "border-surface-container"
              }`}
            >
              <method.icon className={`w-5 h-5 ${selectedShipping === method.id ? "text-primary" : "text-on-surface-muted"}`} />
              <div className="flex-1 text-right">
                <p className="text-sm font-medium">{method.label}</p>
                <p className="text-[11px] text-on-surface-muted">{method.days}</p>
              </div>
              <span className="text-sm font-bold">{formatPrice(method.price)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 mb-4">
        <h2 className="text-sm font-bold mb-3">خلاصه سفارش</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <span className="text-on-surface-muted">
                {item.title} × {toPersianDigits(item.quantity)}
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-surface-container pt-2 mt-2">
            <div className="flex justify-between text-sm">
              <span className="text-on-surface-muted">جمع محصولات</span>
              <span>{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-on-surface-muted">هزینه ارسال ({shipping.label})</span>
              <span>{formatPrice(shipping.price)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-surface-container">
              <span>جمع کل</span>
              <span className="text-primary">{formatPrice(grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-surface-container p-4 max-w-lg mx-auto">
        <Button
          size="full"
          disabled={!selectedAddress || paying}
          onClick={handlePay}
        >
          {paying ? "در حال انتقال به درگاه..." : `پرداخت ${formatPrice(grandTotal)}`}
        </Button>
      </div>
    </div>
  );
}
