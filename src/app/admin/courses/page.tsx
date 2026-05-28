"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toPersianDigits } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  category: string;
  level: string;
  isPublished: boolean;
  lessonsCount: number;
  coach: { name: string };
}

const categoryLabels: Record<string, string> = {
  GENERAL: "عمومی",
  SPEED: "سرعت",
  FREESTYLE: "فریستایل",
  SLALOM: "اسلالوم",
  HOCKEY: "هاکی",
};

const levelLabels: Record<string, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/courses")
      .then((r) => r.json())
      .then((d) => setCourses(d.courses || []))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این دوره مطمئنید؟")) return;
    await fetch(`/api/admin/courses/${id}`, { method: "DELETE" });
    setCourses((prev) => prev.filter((c) => c.id !== id));
  }

  async function togglePublish(id: string, current: boolean) {
    await fetch(`/api/admin/courses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !current }),
    });
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPublished: !current } : c))
    );
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
        <h1 className="text-xl font-bold">مدیریت دوره‌ها</h1>
        <Link href="/admin/courses/new">
          <Button>
            <Plus className="w-4 h-4 ml-2" />
            دوره جدید
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-dim">
            <tr>
              <th className="text-right p-3 font-medium">عنوان</th>
              <th className="text-right p-3 font-medium">دسته‌بندی</th>
              <th className="text-right p-3 font-medium">سطح</th>
              <th className="text-right p-3 font-medium">مربی</th>
              <th className="text-right p-3 font-medium">دروس</th>
              <th className="text-right p-3 font-medium">وضعیت</th>
              <th className="text-right p-3 font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container">
            {courses.map((c) => (
              <tr key={c.id} className="hover:bg-surface-dim/50">
                <td className="p-3 font-medium">{c.title}</td>
                <td className="p-3">{categoryLabels[c.category] || c.category}</td>
                <td className="p-3">{levelLabels[c.level] || c.level}</td>
                <td className="p-3">{c.coach.name}</td>
                <td className="p-3">{toPersianDigits(c.lessonsCount)}</td>
                <td className="p-3">
                  <button
                    onClick={() => togglePublish(c.id, c.isPublished)}
                    className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      c.isPublished
                        ? "bg-green-100 text-green-600"
                        : "bg-surface-dim text-on-surface-muted"
                    }`}
                  >
                    {c.isPublished ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {c.isPublished ? "منتشر" : "پیش‌نویس"}
                  </button>
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/courses/${c.id}`}
                      className="p-1.5 hover:bg-surface-dim rounded-lg"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </Link>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-1.5 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {courses.length === 0 && (
          <p className="p-6 text-center text-on-surface-muted text-sm">دوره‌ای وجود ندارد</p>
        )}
      </div>
    </div>
  );
}
