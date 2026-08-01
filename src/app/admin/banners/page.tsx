"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Plus, Trash2, X, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { cdnUrl } from "@/lib/storage";

interface Banner {
  id: string;
  title: string | null;
  link: string | null;
  imageKey: string;
  order: number;
  isActive: boolean;
}

const emptyForm = { title: "", link: "", imageKey: "", order: "0", isActive: true };

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [order, setOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => { loadBanners(); }, []);

  function loadBanners() {
    fetch("/api/admin/banners")
      .then((r) => r.json())
      .then((d) => setBanners(d.banners || []))
      .finally(() => setLoading(false));
  }

  function resetForm() {
    setTitle(""); setLink(""); setImageKey(""); setOrder("0"); setIsActive(true);
    setEditingId(null);
  }

  function openEdit(b: Banner) {
    setEditingId(b.id);
    setTitle(b.title || "");
    setLink(b.link || "");
    setImageKey(b.imageKey);
    setOrder(String(b.order));
    setIsActive(b.isActive);
    setShowForm(true);
  }

  async function handleSave() {
    if (!imageKey) return;
    setSaving(true);
    try {
      const body = { title: title || null, link: link || null, imageKey, order: parseInt(order) || 0, isActive };
      const res = editingId
        ? await fetch("/api/admin/banners", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: editingId, ...body }),
          })
        : await fetch("/api/admin/banners", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        loadBanners();
      }
    } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف این بنر؟")) return;
    await fetch("/api/admin/banners", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadBanners();
  }

  async function toggleActive(b: Banner) {
    await fetch("/api/admin/banners", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: b.id, isActive: !b.isActive }),
    });
    loadBanners();
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
        <h1 className="text-xl font-bold">مدیریت بنرها</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 ml-2" /> بنر جدید
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">{editingId ? "ویرایش بنر" : "بنر جدید"}</h2>
            <button onClick={() => { setShowForm(false); resetForm(); }}>
              <X className="w-5 h-5 text-on-surface-muted" />
            </button>
          </div>
          <div className="space-y-3">
            <FileUpload
              label="تصویر بنر"
              accept="image"
              bucket="public"
              folder="banners"
              value={imageKey}
              onChange={setImageKey}
              onClear={() => setImageKey("")}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">عنوان (اختیاری)</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثلاً تخفیف ویژه"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">لینک (اختیاری)</label>
                <input type="text" value={link} onChange={(e) => setLink(e.target.value)}
                  placeholder="مثلاً /courses"
                  dir="ltr"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">ترتیب</label>
                <input type="number" value={order} onChange={(e) => setOrder(e.target.value)}
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">وضعیت</label>
                <div className="flex gap-2">
                  <button onClick={() => setIsActive(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${isActive ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                    فعال
                  </button>
                  <button onClick={() => setIsActive(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${!isActive ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                    غیرفعال
                  </button>
                </div>
              </div>
            </div>
            <Button size="full" onClick={handleSave} disabled={!imageKey || saving}>
              {saving ? "ذخیره..." : editingId ? "بروزرسانی بنر" : "افزودن بنر"}
            </Button>
          </div>
        </div>
      )}

      {banners.length > 0 ? (
        <div className="space-y-3">
          {banners.map((b) => (
            <div key={b.id}
              className={`bg-white rounded-[var(--radius-card)] border p-4 ${b.isActive ? "border-surface-container" : "border-red-200 bg-red-50/30"}`}>
              <div className="flex items-start gap-4">
                <div className="w-20 h-[60px] shrink-0 rounded-xl overflow-hidden bg-surface-dim">
                  <img src={cdnUrl(b.imageKey)} alt={b.title || ""} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{b.title || "بدون عنوان"}</p>
                  {b.link && <p className="text-[11px] text-on-surface-muted truncate" dir="ltr">{b.link}</p>}
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-on-surface-muted">
                    <span>ترتیب: {b.order}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => toggleActive(b)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center ${b.isActive ? "bg-green-100 text-green-600" : "bg-surface-dim text-on-surface-muted"}`}>
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => openEdit(b)} className="p-1.5 hover:bg-surface-dim rounded-lg">
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">بنری وجود ندارد</p>
        </div>
      )}
    </div>
  );
}
