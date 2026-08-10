"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Save } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Coach { id: string; name: string; }

export default function AdminNewCoursePage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [coachesLoading, setCoachesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "GENERAL",
    level: "BEGINNER", coachId: "", isPublished: false,
  });

  // The coach list comes straight from the coaches endpoint. It used to be
  // scraped off /api/admin/courses/course-general — a seed id that no longer
  // exists, so that request 404'd and the dropdown silently stayed empty.
  useEffect(() => {
    fetch("/api/coaches")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { coaches?: Coach[] }) => {
        const list = d.coaches ?? [];
        setCoaches(list);
        if (list[0]) setForm((f) => ({ ...f, coachId: list[0].id }));
      })
      .catch(() => setError("دریافت فهرست مربی‌ها ناموفق بود."))
      .finally(() => setCoachesLoading(false));
  }, []);

  const canSubmit = !!form.title.trim() && !!form.coachId && !saving;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.course) {
        setError(data?.error ?? "ایجاد دوره ناموفق بود.");
        setSaving(false);
        return;
      }
      router.push(`/admin/courses/${data.course.id}`);
    } catch {
      setError("ایجاد دوره ناموفق بود.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/courses"><ArrowRight className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">دوره جدید</h1>
      </div>

      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 space-y-4">
        <div>
          <label className="block text-xs font-medium mb-1">عنوان دوره</label>
          <input className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)] focus:border-primary focus:outline-none"
            value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">توضیحات</label>
          <textarea className="w-full h-24 px-3 py-2 text-sm border border-surface-container rounded-[var(--radius-input)] focus:border-primary focus:outline-none resize-none"
            value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1">دسته‌بندی</label>
            <select className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)]"
              value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="GENERAL">عمومی</option>
              <option value="SPEED">سرعت</option>
              <option value="FREESTYLE">فریستایل</option>
              <option value="SLALOM">اسلالوم</option>
              <option value="HOCKEY">هاکی</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">سطح</label>
            <select className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)]"
              value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="BEGINNER">مبتدی</option>
              <option value="INTERMEDIATE">متوسط</option>
              <option value="ADVANCED">پیشرفته</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium mb-1">مربی</label>
          <select className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)] disabled:opacity-60"
            value={form.coachId} disabled={coachesLoading || coaches.length === 0}
            onChange={(e) => setForm({ ...form, coachId: e.target.value })}>
            <option value="">
              {coachesLoading ? "در حال بارگذاری..." : "انتخاب مربی"}
            </option>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {/* Never leave the admin staring at a blank select with no explanation. */}
          {!coachesLoading && coaches.length === 0 && (
            <p className="mt-1 text-xs text-red-600">
              هیچ مربی‌ای ثبت نشده است. برای ایجاد دوره ابتدا باید یک مربی اضافه شود.
            </p>
          )}
          {!coachesLoading && coaches.length > 0 && !form.coachId && (
            <p className="mt-1 text-xs text-red-600">انتخاب مربی الزامی است.</p>
          )}
        </div>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <Button size="full" onClick={handleSubmit} disabled={!canSubmit}>
          <Save className="w-4 h-4 ml-2" />
          {saving ? "در حال ایجاد..." : "ایجاد دوره"}
        </Button>
      </div>
    </div>
  );
}
