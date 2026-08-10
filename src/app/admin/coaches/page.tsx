"use client";

import { useEffect, useState } from "react";
import { Users, Plus, Trash2, X, Edit, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/ui/file-upload";
import { cdnUrl } from "@/lib/storage";
import { toPersianDigits } from "@/lib/utils";

interface Coach {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  specialty: string | null;
  _count: { courses: number };
}

/**
 * `specialty` is free text in the schema and is rendered verbatim on the
 * landing, so these are suggestions (a datalist), not an enum — an admin can
 * still type anything. They match the values already in use.
 */
const SPECIALTY_SUGGESTIONS = [
  "آموزش عمومی",
  "اسکیت سرعت",
  "فری‌استایل",
  "اسلالوم",
  "هاکی",
];

export default function AdminCoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState("");

  useEffect(() => { loadCoaches(); }, []);

  function loadCoaches() {
    fetch("/api/admin/coaches")
      .then((r) => r.json())
      .then((d) => setCoaches(d.coaches || []))
      .finally(() => setLoading(false));
  }

  function resetForm() {
    setName(""); setSpecialty(""); setBio(""); setAvatar("");
    setEditingId(null);
    setError(null);
  }

  function openEdit(c: Coach) {
    setEditingId(c.id);
    setName(c.name);
    setSpecialty(c.specialty || "");
    setBio(c.bio || "");
    setAvatar(c.avatar || "");
    setError(null);
    setShowForm(true);
  }

  const canSave = !!name.trim() && !!specialty.trim() && !saving;

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const body = {
        name: name.trim(),
        specialty: specialty.trim(),
        bio: bio.trim() || null,
        avatar: avatar || null,
      };
      const res = editingId
        ? await fetch(`/api/admin/coaches/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/admin/coaches", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
      if (res.ok) {
        setShowForm(false);
        resetForm();
        loadCoaches();
        return;
      }
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "ذخیره مربی ناموفق بود.");
    } catch {
      setError("ذخیره مربی ناموفق بود.");
    } finally { setSaving(false); }
  }

  async function handleDelete(c: Coach) {
    if (!confirm(`حذف مربی «${c.name}»؟`)) return;
    setError(null);
    const res = await fetch(`/api/admin/coaches/${c.id}`, { method: "DELETE" });
    if (!res.ok) {
      // Most often the 409 from the "coach still owns courses" guard.
      const d = await res.json().catch(() => null);
      setError(d?.error ?? "حذف مربی ناموفق بود.");
      return;
    }
    loadCoaches();
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
        <h1 className="text-xl font-bold">مدیریت مربیان</h1>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 ml-2" /> مربی جدید
        </Button>
      </div>

      {error && !showForm && (
        <div className="mb-4 rounded-[var(--radius-card)] border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-sm">{editingId ? "ویرایش مربی" : "مربی جدید"}</h2>
            <button onClick={() => { setShowForm(false); resetForm(); }}>
              <X className="w-5 h-5 text-on-surface-muted" />
            </button>
          </div>
          <div className="space-y-3">
            <FileUpload
              label="تصویر مربی"
              accept="image"
              bucket="public"
              folder="coaches"
              value={avatar}
              onChange={setAvatar}
              onClear={() => setAvatar("")}
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">نام مربی</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً مجتبی احمدی"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-[11px] text-on-surface-muted mb-1 block">تخصص</label>
                <input type="text" value={specialty} onChange={(e) => setSpecialty(e.target.value)}
                  list="coach-specialties"
                  placeholder="مثلاً اسکیت سرعت"
                  className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-primary" />
                <datalist id="coach-specialties">
                  {SPECIALTY_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-on-surface-muted mb-1 block">بیوگرافی (اختیاری)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="توضیح کوتاه درباره سابقه و تخصص مربی"
                className="w-full border border-surface-container rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary" />
            </div>
            {/* The disabled button says nothing on its own — name the missing field. */}
            {!name.trim() && <p className="text-xs text-red-600">نام مربی الزامی است.</p>}
            {!!name.trim() && !specialty.trim() && (
              <p className="text-xs text-red-600">تخصص مربی الزامی است.</p>
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
            <Button size="full" onClick={handleSave} disabled={!canSave}>
              {saving ? "ذخیره..." : editingId ? "بروزرسانی مربی" : "افزودن مربی"}
            </Button>
          </div>
        </div>
      )}

      {coaches.length > 0 ? (
        <div className="space-y-3">
          {coaches.map((c) => (
            <div key={c.id} className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 shrink-0 rounded-full overflow-hidden bg-surface-dim flex items-center justify-center">
                  {c.avatar ? (
                    <img src={cdnUrl(c.avatar)} alt={c.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-on-surface-muted" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{c.name}</p>
                  {c.specialty && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">
                      {c.specialty}
                    </span>
                  )}
                  {c.bio && (
                    <p className="mt-1 text-[11px] text-on-surface-muted line-clamp-2">{c.bio}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-2 text-[11px] text-on-surface-muted">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{toPersianDigits(c._count.courses)} دوره</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => openEdit(c)} className="p-1.5 hover:bg-surface-dim rounded-lg">
                    <Edit className="w-4 h-4 text-blue-600" />
                  </button>
                  <button onClick={() => handleDelete(c)} className="p-1.5 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <Users className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">مربی‌ای ثبت نشده است</p>
          <p className="text-xs mt-1">برای ساختن دوره، ابتدا باید حداقل یک مربی اضافه کنید.</p>
        </div>
      )}
    </div>
  );
}
