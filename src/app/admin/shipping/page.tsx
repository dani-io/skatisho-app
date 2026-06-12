"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, X, Save, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface Method {
  id: string;
  title: string;
  price: number;
  description: string | null;
  minFreeAmount: number | null;
  isActive: boolean;
}

export default function AdminShippingPage() {
  const [methods, setMethods] = useState<Method[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Method | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [minFree, setMinFree] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, []);

  function loadData() {
    fetch("/api/admin/shipping").then((r) => r.json()).then((d) => setMethods(d.methods || [])).finally(() => setLoading(false));
  }

  function openNew() {
    setEditing(null);
    setTitle(""); setPrice(""); setDesc(""); setMinFree("");
    setShowForm(true);
  }

  function openEdit(m: Method) {
    setEditing(m);
    setTitle(m.title);
    setPrice(m.price.toString());
    setDesc(m.description || "");
    setMinFree(m.minFreeAmount?.toString() || "");
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) {
        await fetch("/api/admin/shipping", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, title, price: parseInt(price), description: desc, minFreeAmount: parseInt(minFree) || null, isActive: editing.isActive }),
        });
      } else {
        await fetch("/api/admin/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, price: parseInt(price), description: desc, minFreeAmount: parseInt(minFree) || null }),
        });
      }
      setShowForm(false);
      loadData();
    } finally { setSaving(false); }
  }

  async function toggleActive(m: Method) {
    await fetch("/api/admin/shipping", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, isActive: !m.isActive }),
    });
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch("/api/admin/shipping", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">روش‌های ارسال</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4 ml-2" />روش جدید</Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">{editing ? "ویرایش" : "روش جدید"}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">عنوان</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="پست پیشتاز"
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">هزینه (تومان)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="150000"
                  className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">توضیحات</label>
              <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="۳ تا ۵ روز کاری"
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">ارسال رایگان بالای (تومان) — خالی = بدون ارسال رایگان</label>
              <input type="number" value={minFree} onChange={(e) => setMinFree(e.target.value)} placeholder="مثلاً ۲,۰۰۰,۰۰۰"
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            </div>
            <Button size="full" onClick={handleSave} disabled={!title || !price || saving}>
              <Save className="w-4 h-4 ml-2" />{saving ? "..." : editing ? "ذخیره" : "افزودن"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {methods.map((m) => (
          <div key={m.id} className={`bg-white rounded-[var(--radius-card)] border p-4 ${m.isActive ? "border-surface-container" : "border-red-200 opacity-60"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-bold text-sm">{m.title}</p>
                  {m.description && <p className="text-xs text-on-surface-muted">{m.description}</p>}
                </div>
              </div>
              <p className="font-bold">{formatPrice(m.price)}</p>
            </div>
            {m.minFreeAmount && (
              <p className="text-xs text-green-600 mt-2">🎉 ارسال رایگان برای سفارش‌های بالای {formatPrice(m.minFreeAmount)}</p>
            )}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-surface-container">
              <button onClick={() => openEdit(m)} className="text-xs text-blue-600 flex items-center gap-1"><Edit className="w-3 h-3" />ویرایش</button>
              <button onClick={() => toggleActive(m)} className="text-xs text-on-surface-muted">{m.isActive ? "غیرفعال" : "فعال"}</button>
              <button onClick={() => handleDelete(m.id)} className="text-xs text-red-500 flex items-center gap-1 mr-auto"><Trash2 className="w-3 h-3" />حذف</button>
            </div>
          </div>
        ))}
        {methods.length === 0 && (
          <div className="text-center py-16 text-on-surface-muted">
            <Truck className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">روش ارسالی تعریف نشده</p>
          </div>
        )}
      </div>
    </div>
  );
}
