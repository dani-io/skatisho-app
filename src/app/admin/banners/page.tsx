"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon, Plus, Trash2, X, Edit, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { cdnUrl } from "@/lib/storage";

interface Banner {
  id: string;
  title: string | null;
  description: string | null;
  link: string | null;
  imageKey: string | null;
  backgroundColor: string | null;
  textColor: string | null;
  order: number;
  isActive: boolean;
}

type BannerMode = "image" | "color";

const DEFAULT_BG = "#EF4444";
const DEFAULT_TEXT = "#FFFFFF";
const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [imageKey, setImageKey] = useState("");
  const [mode, setMode] = useState<BannerMode>("image");
  const [description, setDescription] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(DEFAULT_BG);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
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
    setMode("image"); setDescription(""); setBackgroundColor(DEFAULT_BG); setTextColor(DEFAULT_TEXT);
    setEditingId(null);
  }

  function openEdit(b: Banner) {
    setEditingId(b.id);
    setTitle(b.title || "");
    setLink(b.link || "");
    setImageKey(b.imageKey || "");
    setMode(b.imageKey ? "image" : "color");
    setDescription(b.description || "");
    setBackgroundColor(b.backgroundColor || DEFAULT_BG);
    setTextColor(b.textColor || DEFAULT_TEXT);
    setOrder(String(b.order));
    setIsActive(b.isActive);
    setShowForm(true);
  }

  // An image banner needs an image; a colour banner needs valid colours and some text to show.
  const canSave =
    mode === "image"
      ? !!imageKey
      : HEX_RE.test(backgroundColor) && HEX_RE.test(textColor) && !!(title || description);

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    try {
      const isColor = mode === "color";
      const body = {
        title: title || null,
        link: link || null,
        imageKey: isColor ? null : imageKey,
        description: isColor ? description || null : null,
        backgroundColor: isColor ? backgroundColor : null,
        textColor: isColor ? textColor : null,
        order: parseInt(order) || 0,
        isActive,
      };
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
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">نوع بنر</label>
              <div className="flex gap-2">
                <button onClick={() => setMode("image")}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${mode === "image" ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                  بنر تصویری
                </button>
                <button onClick={() => setMode("color")}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border-2 ${mode === "color" ? "border-primary bg-primary/5" : "border-surface-container"}`}>
                  بنر رنگی
                </button>
              </div>
              <p className="text-[11px] text-on-surface-muted mt-1.5">
                {mode === "image"
                  ? "یک تصویر آپلود کنید. عنوان روی تصویر نمایش داده می‌شود."
                  : "بدون تصویر؛ عنوان و توضیحات روی رنگ پس‌زمینه نمایش داده می‌شوند."}
              </p>
            </div>
            {mode === "image" ? (
              <FileUpload
                label="تصویر بنر"
                accept="image"
                bucket="public"
                folder="banners"
                value={imageKey}
                onChange={setImageKey}
                onClear={() => setImageKey("")}
              />
            ) : (
              <>
                <div>
                  <label className="text-[11px] text-on-surface-muted mb-1 block">توضیحات (اختیاری)</label>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="مثلاً همین الان اشتراک بگیرید"
                    className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    ["رنگ پس‌زمینه", backgroundColor, setBackgroundColor, DEFAULT_BG],
                    ["رنگ متن", textColor, setTextColor, DEFAULT_TEXT],
                  ] as const).map(([label, value, setValue, fallback]) => (
                    <div key={label}>
                      <label className="text-[11px] text-on-surface-muted mb-1 block">{label}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={HEX_RE.test(value) ? value : fallback}
                          onChange={(e) => setValue(e.target.value.toUpperCase())}
                          className="w-10 h-9 shrink-0 rounded-lg border border-surface-container cursor-pointer" />
                        <input type="text" value={value} onChange={(e) => setValue(e.target.value)}
                          dir="ltr" maxLength={7}
                          className={`w-full border rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-primary ${HEX_RE.test(value) ? "border-surface-container" : "border-red-300"}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="text-[11px] text-on-surface-muted mb-1 block">پیش‌نمایش</label>
                  <div className="rounded-xl p-4 flex flex-col justify-center gap-1 min-h-[80px]"
                    style={{ backgroundColor: HEX_RE.test(backgroundColor) ? backgroundColor : DEFAULT_BG, color: HEX_RE.test(textColor) ? textColor : DEFAULT_TEXT }}>
                    <p className="text-sm font-bold">{title || "عنوان بنر"}</p>
                    {description && <p className="text-xs opacity-90">{description}</p>}
                  </div>
                </div>
              </>
            )}
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
            <Button size="full" onClick={handleSave} disabled={!canSave || saving}>
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
                {b.imageKey ? (
                  <div className="w-20 h-[60px] shrink-0 rounded-xl overflow-hidden bg-surface-dim">
                    <img src={cdnUrl(b.imageKey)} alt={b.title || ""} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-20 h-[60px] shrink-0 rounded-xl overflow-hidden flex items-center justify-center p-1.5 text-[10px] font-bold text-center leading-tight"
                    style={{ backgroundColor: b.backgroundColor || DEFAULT_BG, color: b.textColor || DEFAULT_TEXT }}>
                    <span className="line-clamp-2">{b.title || "بنر رنگی"}</span>
                  </div>
                )}
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
