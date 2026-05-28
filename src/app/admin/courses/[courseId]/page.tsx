"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, Plus, Trash2, ChevronDown, GripVertical,
  Play, Lock, Save, Video,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, toPersianDigits, formatDuration } from "@/lib/utils";

interface Lesson {
  id: string;
  title: string;
  videoUrl: string;
  duration: number;
  isFree: boolean;
  order: number;
}

interface Chapter {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  category: string;
  level: string;
  coachId: string;
  isPublished: boolean;
  order: number;
  chapters: Chapter[];
}

interface Coach {
  id: string;
  name: string;
}

export default function AdminCourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<Course | null>(null);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());

  // New chapter/lesson forms
  const [newChapterTitle, setNewChapterTitle] = useState("");
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [newLesson, setNewLesson] = useState({ title: "", videoUrl: "", duration: 0, isFree: false });

  useEffect(() => {
    fetch(`/api/admin/courses/${courseId}`)
      .then((r) => r.json())
      .then((d) => {
        setCourse(d.course);
        setCoaches(d.coaches || []);
        if (d.course?.chapters?.[0]) {
          setOpenChapters(new Set([d.course.chapters[0].id]));
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  async function saveCourse() {
    if (!course) return;
    setSaving(true);
    await fetch(`/api/admin/courses/${courseId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(course),
    });
    setSaving(false);
  }

  async function addChapter() {
    if (!newChapterTitle.trim()) return;
    const res = await fetch(`/api/admin/courses/${courseId}/chapters`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newChapterTitle }),
    });
    const { chapter } = await res.json();
    setCourse((prev) =>
      prev ? { ...prev, chapters: [...prev.chapters, { ...chapter, lessons: [] }] } : prev
    );
    setNewChapterTitle("");
    setOpenChapters((prev) => new Set([...prev, chapter.id]));
  }

  async function deleteChapter(chapterId: string) {
    if (!confirm("فصل و تمام دروس آن حذف می‌شود. مطمئنید؟")) return;
    await fetch(`/api/admin/courses/${courseId}/chapters?id=${chapterId}`, { method: "DELETE" });
    setCourse((prev) =>
      prev ? { ...prev, chapters: prev.chapters.filter((c) => c.id !== chapterId) } : prev
    );
  }

  async function addLesson(chapterId: string) {
    if (!newLesson.title.trim() || !newLesson.videoUrl.trim()) return;
    const res = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLesson),
    });
    const { lesson } = await res.json();
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((ch) =>
          ch.id === chapterId ? { ...ch, lessons: [...ch.lessons, lesson] } : ch
        ),
      };
    });
    setNewLesson({ title: "", videoUrl: "", duration: 0, isFree: false });
    setAddingLesson(null);
  }

  async function deleteLesson(chapterId: string, lessonId: string) {
    if (!confirm("این درس حذف می‌شود. مطمئنید؟")) return;
    await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}/lessons?id=${lessonId}`, {
      method: "DELETE",
    });
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((ch) =>
          ch.id === chapterId
            ? { ...ch, lessons: ch.lessons.filter((l) => l.id !== lessonId) }
            : ch
        ),
      };
    });
  }

  function toggleChapter(id: string) {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading || !course) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/courses"><ArrowRight className="w-5 h-5" /></Link>
        <h1 className="text-xl font-bold">ویرایش دوره</h1>
      </div>

      {/* Course Info Form */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5 mb-6">
        <h2 className="font-bold text-sm mb-4">اطلاعات دوره</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1">عنوان</label>
            <input
              className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)] focus:border-primary focus:outline-none"
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">توضیحات</label>
            <textarea
              className="w-full h-24 px-3 py-2 text-sm border border-surface-container rounded-[var(--radius-input)] focus:border-primary focus:outline-none resize-none"
              value={course.description || ""}
              onChange={(e) => setCourse({ ...course, description: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">دسته‌بندی</label>
              <select
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)]"
                value={course.category}
                onChange={(e) => setCourse({ ...course, category: e.target.value })}
              >
                <option value="GENERAL">عمومی</option>
                <option value="SPEED">سرعت</option>
                <option value="FREESTYLE">فریستایل</option>
                <option value="SLALOM">اسلالوم</option>
                <option value="HOCKEY">هاکی</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">سطح</label>
              <select
                className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)]"
                value={course.level}
                onChange={(e) => setCourse({ ...course, level: e.target.value })}
              >
                <option value="BEGINNER">مبتدی</option>
                <option value="INTERMEDIATE">متوسط</option>
                <option value="ADVANCED">پیشرفته</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">مربی</label>
            <select
              className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)]"
              value={course.coachId}
              onChange={(e) => setCourse({ ...course, coachId: e.target.value })}
            >
              {coaches.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="published"
              checked={course.isPublished}
              onChange={(e) => setCourse({ ...course, isPublished: e.target.checked })}
              className="accent-primary"
            />
            <label htmlFor="published" className="text-sm">منتشر شده</label>
          </div>
          <Button onClick={saveCourse} disabled={saving}>
            <Save className="w-4 h-4 ml-2" />
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </div>

      {/* Chapters & Lessons */}
      <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-sm">فصل‌ها و دروس</h2>
        </div>

        <div className="space-y-3">
          {course.chapters.map((chapter) => (
            <div key={chapter.id} className="border border-surface-container rounded-xl overflow-hidden">
              {/* Chapter Header */}
              <div className="flex items-center gap-2 p-3 bg-surface-dim">
                <button onClick={() => toggleChapter(chapter.id)}>
                  <ChevronDown className={cn("w-4 h-4 transition-transform", openChapters.has(chapter.id) && "rotate-180")} />
                </button>
                <span className="flex-1 text-sm font-medium">{chapter.title}</span>
                <span className="text-xs text-on-surface-muted">
                  {toPersianDigits(chapter.lessons.length)} درس
                </span>
                <button onClick={() => deleteChapter(chapter.id)} className="p-1 hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>

              {/* Lessons */}
              {openChapters.has(chapter.id) && (
                <div>
                  {chapter.lessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-surface-container text-sm">
                      <Video className="w-4 h-4 text-on-surface-muted shrink-0" />
                      <span className="flex-1">{lesson.title}</span>
                      <span className="text-xs text-on-surface-muted">{formatDuration(lesson.duration)}</span>
                      {lesson.isFree && (
                        <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">رایگان</span>
                      )}
                      <button onClick={() => deleteLesson(chapter.id, lesson.id)} className="p-1 hover:bg-red-50 rounded">
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  ))}

                  {/* Add Lesson Form */}
                  {addingLesson === chapter.id ? (
                    <div className="p-3 border-t border-surface-container bg-surface-dim/50 space-y-2">
                      <input
                        placeholder="عنوان درس"
                        className="w-full h-9 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      />
                      <input
                        placeholder="آدرس ویدئو (مثلاً /media/lesson1.mp4)"
                        dir="ltr"
                        className="w-full h-9 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                        value={newLesson.videoUrl}
                        onChange={(e) => setNewLesson({ ...newLesson, videoUrl: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="مدت (ثانیه)"
                          className="w-28 h-9 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                          value={newLesson.duration || ""}
                          onChange={(e) => setNewLesson({ ...newLesson, duration: parseInt(e.target.value) || 0 })}
                        />
                        <label className="flex items-center gap-1 text-sm">
                          <input
                            type="checkbox"
                            checked={newLesson.isFree}
                            onChange={(e) => setNewLesson({ ...newLesson, isFree: e.target.checked })}
                            className="accent-primary"
                          />
                          رایگان
                        </label>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => addLesson(chapter.id)}>افزودن</Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingLesson(null)}>انصراف</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setAddingLesson(chapter.id)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 border-t border-surface-container text-xs text-primary hover:bg-primary/5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      افزودن درس
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Chapter */}
        <div className="flex gap-2 mt-4">
          <input
            placeholder="عنوان فصل جدید"
            className="flex-1 h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)] focus:border-primary focus:outline-none"
            value={newChapterTitle}
            onChange={(e) => setNewChapterTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addChapter()}
          />
          <Button onClick={addChapter} disabled={!newChapterTitle.trim()}>
            <Plus className="w-4 h-4 ml-1" />
            فصل
          </Button>
        </div>
      </div>
    </div>
  );
}
