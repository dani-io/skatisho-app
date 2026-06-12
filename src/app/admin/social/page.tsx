"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Save, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORMS = [
  { id: "instagram", label: "اینستاگرام" },
  { id: "telegram", label: "تلگرام" },
  { id: "linkedin", label: "لینکدین" },
  { id: "x", label: "ایکس (توییتر)" },
  { id: "youtube", label: "یوتیوب" },
  { id: "aparat", label: "آپارات" },
  { id: "whatsapp", label: "واتساپ" },
];

interface Link { id: string; platform: string; url: string; isActive: boolean; }

export default function AdminSocialPage() {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [platform, setPlatform] = useState("instagram");
  const [url, setUrl] = useState("");
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  function loadData() {
    fetch("/api/social").then((r) => r.json()).then((d) => setLinks(d.links || [])).finally(() => setLoading(false));
  }

  async function handleSave() {
    await fetch("/api/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editId, platform, url }),
    });
    setShowForm(false); setEditId(null); setPlatform("instagram"); setUrl("");
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("حذف شود؟")) return;
    await fetch("/api/social", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadData();
  }

  function openEdit(link: Link) {
    setEditId(link.id); setPlatform(link.platform); setUrl(link.url); setShowForm(true);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">شبکه‌های اجتماعی</h1>
        <Button onClick={() => { setEditId(null); setPlatform("instagram"); setUrl(""); setShowForm(true); }}>
          <Plus className="w-4 h-4 ml-2" />افزودن
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold">{editId ? "ویرایش" : "لینک جدید"}</h2>
            <button onClick={() => setShowForm(false)}><X className="w-4 h-4" /></button>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">پلتفرم</label>
              <select value={platform} onChange={(e) => setPlatform(e.target.value)}
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg">
                {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">لینک</label>
              <input dir="ltr" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..."
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none" />
            </div>
            <Button size="full" onClick={handleSave} disabled={!url.trim()}>
              <Save className="w-4 h-4 ml-2" />{editId ? "ذخیره" : "افزودن"}
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {links.map((link) => (
          <div key={link.id} className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-bold">{PLATFORMS.find((p) => p.id === link.platform)?.label || link.platform}</p>
                <p className="text-xs text-on-surface-muted" dir="ltr">{link.url}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => openEdit(link)} className="text-xs text-blue-600">ویرایش</button>
              <button onClick={() => handleDelete(link.id)} className="text-xs text-red-500">حذف</button>
            </div>
          </div>
        ))}
        {links.length === 0 && (
          <div className="text-center py-16 text-on-surface-muted">
            <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-sm">لینکی وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
