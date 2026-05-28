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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", description: "", category: "GENERAL",
    level: "BEGINNER", coachId: "", isPublished: false,
  });

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then(() => {
        // Get coaches from a course detail endpoint workaround
        fetch("/api/admin/courses/course-general")
          .then((r) => r.json())
          .then((d) => {
            if (d.coaches) {
              setCoaches(d.coaches);
              if (d.coaches[0]) setForm((f) => ({ ...f, coachId: d.coaches[0].id }));
            }
          });
      });
  }, []);

  async function handleSubmit() {
    if (!form.title.trim() || !form.coachId) return;
    setSaving(true);
    const res = await fetch("/api/admin/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const { course } = await res.json();
    router.push(`/admin/courses/${course.id}`);
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
          <select className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)]"
            value={form.coachId} onChange={(e) => setForm({ ...form, coachId: e.target.value })}>
            {coaches.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <Button size="full" onClick={handleSubmit} disabled={saving || !form.title.trim()}>
          <Save className="w-4 h-4 ml-2" />
          {saving ? "در حال ایجاد..." : "ایجاد دوره"}
        </Button>
      </div>
    </div>
  );
}
