"use client";

import { useEffect, useState } from "react";
import {
  Tag, Plus, Trash2, X, Percent, DollarSign, Clock, Users, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  _count: { usages: number };
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form
  const [code, setCode] = useState("");
  const [type, setType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [value, setValue] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [description, setDescription] = useState("");
  const [scope, setScope] = useState("ALL");

  useEffect(() => { loadCoupons(); }, []);

  function loadCoupons() {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((data) => setCoupons(data.coupons || []))
      .finally(() => setLoading(false));
  }

  async function handleCreate() {
    if (!code.trim() || !value) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code, type, value, minAmount, maxDiscount, usageLimit, expiresAt, description, scope,
        }),
      });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        loadCoupons();
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف این کد تخفیف؟")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadCoupons();
  }

  function resetForm() {
    setCode(""); setValue(""); setMinAmount(""); setMaxDiscount("");
    setUsageLimit(""); setExpiresAt(""); setDescription(""); setType("PERCENT"); setScope("ALL");
  }

  function copyCode(couponCode: string, id: string) {
    navigator.clipboard.writeText(couponCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">کدهای تخفیف</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 ml-2" /> کد جدید
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">کد تخفیف جدید</h2>
            <button onClick={() => { setShowForm(false); resetForm(); }}>
              <X className="w-5 h-5 text-on-surface-muted" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">کد تخفیف</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="مثلاً SKATE20" dir="ltr"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">نوع تخفیف</label>
                <div className="flex gap-2">
                  <button onClick={() => setType("PERCENT")}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${type === "PERCENT" ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                    درصدی ٪
                  </button>
                  <button onClick={() => setType("FIXED")}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${type === "FIXED" ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                    مبلغ ثابت
                  </button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">
                  {type === "PERCENT" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
                </label>
                <input type="number" value={value} onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "PERCENT" ? "۲۰" : "۵۰۰۰۰"}
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              {type === "PERCENT" && (
                <div>
                  <label className="text-[11px] text-on-surface-muted mb-1 block">سقف تخفیف (تومان)</label>
                  <input type="number" value={maxDiscount} onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="۵۰۰۰۰۰"
                    className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
              )}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">حداقل خرید</label>
                <input type="number" value={minAmount} onChange={(e) => setMinAmount(e.target.value)}
                  placeholder="اختیاری"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">تعداد استفاده</label>
                <input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="نامحدود"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">تاریخ انقضا</label>
                <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">قابل استفاده در</label>
              <div className="flex gap-2">
                {[
                  { id: "ALL", label: "همه" },
                  { id: "SUBSCRIPTION", label: "اشتراک" },
                  { id: "SHOP", label: "فروشگاه" },
                ].map((s) => (
                  <button key={s.id} onClick={() => setScope(s.id)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 transition-colors ${
                      scope === s.id ? "border-primary bg-primary/5" : "border-surface-container"
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">توضیحات</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="مثلاً: تخفیف ویژه افتتاحیه"
                className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
            </div>
            <Button size="full" onClick={handleCreate} disabled={!code.trim() || !value || saving}>
              {saving ? "ذخیره..." : "ساخت کد تخفیف"}
            </Button>
          </div>
        </div>
      )}

      {/* Coupons List */}
      {coupons.length > 0 ? (
        <div className="space-y-3">
          {coupons.map((coupon) => {
            const isExpired = coupon.expiresAt && new Date(coupon.expiresAt) < new Date();
            const isFull = coupon.usageLimit && coupon.usedCount >= coupon.usageLimit;
            const isActive = coupon.isActive && !isExpired && !isFull;
            return (
              <div key={coupon.id}
                className={`bg-white rounded-[var(--radius-card)] border p-4 ${isActive ? "border-surface-container" : "border-red-200 bg-red-50/30"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      coupon.type === "PERCENT" ? "bg-purple-100 text-purple-600" : "bg-green-100 text-green-600"
                    }`}>
                      {coupon.type === "PERCENT" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                    </div>
                    <div>
                      <button onClick={() => copyCode(coupon.code, coupon.id)}
                        className="flex items-center gap-1 text-sm font-bold" dir="ltr">
                        {coupon.code}
                        {copiedId === coupon.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-on-surface-muted" />}
                      </button>
                      <p className="text-[10px] text-on-surface-muted">
                        {coupon.type === "PERCENT"
                          ? `${toPersianDigits(coupon.value)}٪ تخفیف`
                          : `${formatPrice(coupon.value)} تخفیف`}
                        {coupon.maxDiscount && ` (سقف ${formatPrice(coupon.maxDiscount)})`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    }`}>
                      {isActive ? "فعال" : isExpired ? "منقضی" : isFull ? "تمام شده" : "غیرفعال"}
                    </span>
                    <button onClick={() => handleDelete(coupon.id)} className="text-on-surface-muted hover:text-error">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-on-surface-muted">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {toPersianDigits(coupon._count.usages)}/{coupon.usageLimit ? toPersianDigits(coupon.usageLimit) : "∞"} استفاده
                  </span>
                  {coupon.minAmount && (
                    <span>حداقل: {formatPrice(coupon.minAmount)}</span>
                  )}
                  {coupon.expiresAt && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(coupon.expiresAt).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </div>
                {coupon.description && (
                  <p className="text-[11px] text-on-surface-muted mt-2 border-t border-surface-container pt-2">
                    {coupon.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <Tag className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">کد تخفیفی وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
