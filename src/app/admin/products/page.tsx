"use client";

import { useEffect, useState } from "react";
import {
  Plus, Trash2, Edit, X, Save, Package, Settings, Palette, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, toPersianDigits } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { fileUrl } from "@/lib/storage";

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
  category: string;
  brand: string | null;
  inStock: boolean;
  isPublished: boolean;
  customizable: boolean;
  options: ProductOption[] | null;
  thumbnail: string | null;
  images: string[];
}

const categoryOptions = [
  { value: "INLINE_SKATE", label: "اسکیت اینلاین" },
  { value: "SPEED_SKATE", label: "اسکیت سرعت" },
  { value: "PROTECTIVE_GEAR", label: "محافظ" },
  { value: "WHEELS", label: "چرخ" },
  { value: "BEARINGS", label: "بلبرینگ" },
  { value: "ACCESSORIES", label: "لوازم جانبی" },
];

const emptyForm = {
  title: "", description: "", price: 0, originalPrice: 0,
  category: "INLINE_SKATE", brand: "", inStock: true, isPublished: true,
  customizable: false, options: [] as ProductOption[],
  thumbnail: null as string | null,
  images: [] as string[],
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  function loadProducts() {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }

  function openNew() {
    setForm(emptyForm);
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
      customizable: p.customizable || false,
      thumbnail: p.thumbnail || null,
      options: p.options || [],
      images: p.images || [],
    });
    setEditing(p.id);
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        originalPrice: form.originalPrice || null,
        options: form.customizable && form.options.length > 0 ? form.options : null,
      };

      if (editing) {
        const res = await fetch("/api/admin/products", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing, ...payload }),
        });
        const { product } = await res.json();
        setProducts((prev) => prev.map((p) => (p.id === editing ? product : p)));
      } else {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const { product } = await res.json();
        setProducts((prev) => [...prev, product]);
      }
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("محصول حذف شود؟")) return;
    await fetch(`/api/admin/products?id=${id}`, { method: "DELETE" });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  // Option management helpers
  function addOptionGroup() {
    setForm((f) => ({
      ...f,
      options: [...f.options, { name: "", type: "select", values: [] }],
    }));
  }

  function updateOptionGroup(index: number, field: string, value: any) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) => (i === index ? { ...o, [field]: value } : o)),
    }));
  }

  function removeOptionGroup(index: number) {
    setForm((f) => ({
      ...f,
      options: f.options.filter((_, i) => i !== index),
    }));
  }

  function addOptionValue(groupIndex: number) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === groupIndex
          ? { ...o, values: [...o.values, { label: "", color: "#000000", priceAdjust: 0 }] }
          : o
      ),
    }));
  }

  function updateOptionValue(groupIndex: number, valueIndex: number, field: string, val: any) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === groupIndex
          ? {
              ...o,
              values: o.values.map((v, j) =>
                j === valueIndex ? { ...v, [field]: val } : v
              ),
            }
          : o
      ),
    }));
  }

  function removeOptionValue(groupIndex: number, valueIndex: number) {
    setForm((f) => ({
      ...f,
      options: f.options.map((o, i) =>
        i === groupIndex
          ? { ...o, values: o.values.filter((_, j) => j !== valueIndex) }
          : o
      ),
    }));
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
          <Plus className="w-4 h-4 ml-2" /> محصول جدید
        </Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[var(--radius-card)] w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold">{editing ? "ویرایش محصول" : "محصول جدید"}</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
            <FileUpload
                label="تصویر محصول"
                accept="image"
                folder="products"
                value={form.thumbnail}
                onChange={(url) => setForm({ ...form, thumbnail: url })}
                onClear={() => setForm({ ...form, thumbnail: null })}
              />
              {/* Basic Fields */}
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
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={form.inStock} onChange={(e) => setForm({ ...form, inStock: e.target.checked })} className="accent-primary" />
                  موجود
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="accent-primary" />
                  منتشر
                </label>
              </div>
                {/* Multi Images */}
              <div>
                <label className="block text-xs font-medium mb-1">تصاویر بیشتر</label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {form.images.map((img, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-surface-container">
                      <img src={fileUrl(img)} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setForm({ ...form, images: form.images.filter((_, j) => j !== i) })}
                        className="absolute top-1 left-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                </div>
                {form.images.length < 6 && (
                  <FileUpload
                    label=""
                    accept="image"
                    folder="products/gallery"
                    value={null}
                    onChange={(url) => setForm({ ...form, images: [...form.images, url] })}
                  />
                )}
              </div>
              {/* Customization Section */}
              <div className="border-t border-surface-container pt-3 mt-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-primary" />
                    <span className="text-sm font-bold">محصول سفارشی</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full transition-colors relative ${form.customizable ? "bg-primary" : "bg-gray-300"}`}
                    onClick={() => setForm({ ...form, customizable: !form.customizable })}>
                    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${form.customizable ? "left-5" : "left-0.5"}`} />
                  </div>
                </label>
                <p className="text-[11px] text-on-surface-muted mt-1">کاربر بتونه رنگ، سایز، چرخ و ... انتخاب کنه</p>
              </div>

              {form.customizable && (
                <div className="space-y-4 bg-surface-dim rounded-xl p-4">
                  {form.options.map((opt, gi) => (
                    <div key={gi} className="bg-white rounded-xl p-3 border border-surface-container">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-on-surface-muted">گزینه {toPersianDigits(gi + 1)}</span>
                        <button onClick={() => removeOptionGroup(gi)} className="text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <input placeholder="نام (مثلاً: رنگ)" value={opt.name}
                          onChange={(e) => updateOptionGroup(gi, "name", e.target.value)}
                          className="h-9 px-3 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
                        <select value={opt.type} onChange={(e) => updateOptionGroup(gi, "type", e.target.value)}
                          className="h-9 px-3 text-xs border border-surface-container rounded-lg">
                          <option value="select">انتخابی</option>
                          <option value="color">رنگ</option>
                        </select>
                      </div>

                      {/* Values */}
                      <div className="space-y-2">
                        {opt.values.map((val, vi) => (
                          <div key={vi} className="flex items-center gap-2">
                            {opt.type === "color" && (
                              <input type="color" value={val.color || "#000000"}
                                onChange={(e) => updateOptionValue(gi, vi, "color", e.target.value)}
                                className="w-8 h-8 rounded border-0 cursor-pointer" />
                            )}
                            <input placeholder="عنوان" value={val.label}
                              onChange={(e) => updateOptionValue(gi, vi, "label", e.target.value)}
                              className="flex-1 h-8 px-2 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
                            <input type="number" placeholder="+ قیمت" value={val.priceAdjust || ""}
                              onChange={(e) => updateOptionValue(gi, vi, "priceAdjust", parseInt(e.target.value) || 0)}
                              className="w-24 h-8 px-2 text-xs border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
                            <button onClick={() => removeOptionValue(gi, vi)} className="text-red-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => addOptionValue(gi)}
                          className="flex items-center gap-1 text-[11px] text-primary font-medium mt-1">
                          <Plus className="w-3 h-3" /> افزودن مقدار
                        </button>
                      </div>
                    </div>
                  ))}

                  <button onClick={addOptionGroup}
                    className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-primary/30 rounded-xl text-xs text-primary font-medium hover:bg-primary/5 transition-colors">
                    <Plus className="w-4 h-4" /> افزودن گزینه جدید (رنگ، سایز، ...)
                  </button>
                </div>
              )}

              <Button size="full" onClick={handleSave} disabled={!form.title || !form.price || saving}>
                <Save className="w-4 h-4 ml-2" />
                {saving ? "ذخیره..." : editing ? "ذخیره تغییرات" : "افزودن محصول"}
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
                  <div className="flex items-center gap-2">
                    <div>
                      <p className="font-medium">{p.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {p.brand && <span className="text-[10px] text-on-surface-muted">{p.brand}</span>}
                        {p.customizable && (
                          <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">سفارشی</span>
                        )}
                      </div>
                    </div>
                  </div>
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
