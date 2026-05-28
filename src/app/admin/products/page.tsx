"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Edit, X, Save, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  category: string;
  brand: string | null;
  inStock: boolean;
  isPublished: boolean;
}

const categoryOptions = [
  { value: "INLINE_SKATE", label: "اسکیت اینلاین" },
  { value: "SPEED_SKATE", label: "اسکیت سرعت" },
  { value: "PROTECTIVE_GEAR", label: "محافظ" },
  { value: "WHEELS", label: "چرخ" },
  { value: "BEARINGS", label: "بلبرینگ" },
  { value: "ACCESSORIES", label: "لوازم جانبی" },
];

const emptyProduct = {
  title: "", description: "", price: 0, originalPrice: 0,
  category: "INLINE_SKATE", brand: "", inStock: true, isPublished: true,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  function openNew() {
    setForm(emptyProduct);
    setEditing(null);
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setForm({
      title: p.title,
      description: p.description || "",
      price: p.price,
      originalPrice: p.originalPrice || 0,
      category: p.category,
      brand: p.brand || "",
      inStock: p.inStock,
      isPublished: p.isPublished,
    });
    setEditing(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    if (editing) {
      const res = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing, ...form, originalPrice: form.originalPrice || null }),
      });
      const { product } = await res.json();
      setProducts((prev) => prev.map((p) => (p.id === editing ? product : p)));
    } else {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, originalPrice: form.originalPrice || null }),
      });
      const { product } = await res.json();
      setProducts((prev) => [...prev, product]);
    }
    setShowForm(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("محصول حذف شود؟")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
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
        <h1 className="text-xl font-bold">مدیریت محصولات</h1>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4 ml-2" />
          محصول جدید
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[var(--radius-card)] w-full max-w-md max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">{editing ? "ویرایش محصول" : "محصول جدید"}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1">عنوان</label>
                <input className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">توضیحات</label>
                <textarea className="w-full h-20 px-3 py-2 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none resize-none"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">قیمت (تومان)</label>
                  <input type="number" className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                    value={form.price} onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">قیمت اصلی (اختیاری)</label>
                  <input type="number" className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                    value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: parseInt(e.target.value) || 0 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">دسته‌بندی</label>
                  <select className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg"
                    value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {categoryOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">برند</label>
                  <input className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                    value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="accent-primary" />
                  موجود
                </label>
                <label className="flex items-center gap-1 text-sm">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-primary" />
                  منتشر
                </label>
              </div>
              <Button size="full" onClick={handleSave}>
                <Save className="w-4 h-4 ml-2" />
                {editing ? "ذخیره تغییرات" : "افزودن محصول"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-dim">
            <tr>
              <th className="text-right p-3 font-medium">محصول</th>
              <th className="text-right p-3 font-medium">دسته</th>
              <th className="text-right p-3 font-medium">قیمت</th>
              <th className="text-right p-3 font-medium">موجودی</th>
              <th className="text-right p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-surface-dim/50">
                <td className="p-3">
                  <p className="font-medium">{p.title}</p>
                  {p.brand && <p className="text-xs text-on-surface-muted">{p.brand}</p>}
                </td>
                <td className="p-3 text-xs">{categoryOptions.find((o) => o.value === p.category)?.label}</td>
                <td className="p-3">{formatPrice(p.price)}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${p.inStock ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                    {p.inStock ? "موجود" : "ناموجود"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEdit(p)} className="p-1.5 hover:bg-surface-dim rounded-lg">
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && (
          <div className="p-8 text-center text-on-surface-muted">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">محصولی وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
