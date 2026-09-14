"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight, Plus, Trash2, ChevronDown, ChevronUp, GripVertical,
  Play, Lock, Save, Video, Pencil,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn, toPersianDigits, formatDuration } from "@/lib/utils";
import { FileUpload } from "@/components/ui/file-upload";
import { cdnUrl } from "@/lib/storage";

interface Lesson {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number;
  thumbnail: string | null;
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
  thumbnail: string | null;
  category: string;
  level: string;
  coachId: string;
  isPublished: boolean;
  price: number | null;
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
  const [newLesson, setNewLesson] = useState({ title: "", description: "", videoUrl: "", duration: 0, isFree: false, thumbnail: "" });

  // Edit mirrors the add form. videoUrl/thumbnail hold only a NEWLY uploaded
  // key ("" = no replacement); an empty one is left out of the PUT so the stored
  // media is kept.
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editLesson, setEditLesson] = useState({ title: "", description: "", duration: 0, isFree: false, videoUrl: "", thumbnail: "" });
  const [editError, setEditError] = useState("");
  const [savingLesson, setSavingLesson] = useState(false);

  // Chapter whose reorder request is in flight; its arrows stay disabled until
  // the server answers so two moves cannot race each other.
  const [reorderingChapter, setReorderingChapter] = useState<string | null>(null);
  const [reorderError, setReorderError] = useState<{ chapterId: string; message: string } | null>(null);

  // Same idea one level up: while a chapter move is in flight every chapter
  // arrow is disabled, since each request sends the whole ordered list.
  const [movingChapters, setMovingChapters] = useState(false);
  const [chapterReorderError, setChapterReorderError] = useState("");

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
    setNewLesson({ title: "", description: "", videoUrl: "", duration: 0, isFree: false, thumbnail: "" });
    setAddingLesson(null);
  }

  function startEditLesson(lesson: Lesson) {
    setEditingLesson(lesson.id);
    setEditError("");
    setEditLesson({
      title: lesson.title,
      description: lesson.description || "",
      duration: lesson.duration,
      isFree: lesson.isFree,
      videoUrl: "",
      thumbnail: "",
    });
  }

  async function saveLesson(chapterId: string, lessonId: string) {
    if (!editLesson.title.trim()) return;
    setSavingLesson(true);
    setEditError("");

    const { videoUrl, thumbnail, ...fields } = editLesson;
    const res = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}/lessons`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: lessonId,
        ...fields,
        ...(videoUrl ? { videoUrl } : {}),
        ...(thumbnail ? { thumbnail } : {}),
      }),
    });
    setSavingLesson(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setEditError(data.error || "خطا در ذخیره درس");
      return;
    }

    const { lesson } = await res.json();
    setCourse((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        chapters: prev.chapters.map((ch) =>
          ch.id === chapterId
            ? { ...ch, lessons: ch.lessons.map((l) => (l.id === lessonId ? lesson : l)) }
            : ch
        ),
      };
    });
    setEditingLesson(null);
  }

  async function moveLesson(chapterId: string, lessonId: string, direction: -1 | 1) {
    const chapter = course?.chapters.find((ch) => ch.id === chapterId);
    if (!chapter) return;

    const previous = chapter.lessons;
    const ordered = [...previous].sort((a, b) => a.order - b.order);
    const from = ordered.findIndex((l) => l.id === lessonId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ordered.length) return;

    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    const next = ordered.map((l, index) => ({ ...l, order: index }));

    const setLessons = (lessons: Lesson[]) =>
      setCourse((prev) =>
        prev
          ? { ...prev, chapters: prev.chapters.map((ch) => (ch.id === chapterId ? { ...ch, lessons } : ch)) }
          : prev
      );

    setLessons(next);
    setReorderError(null);
    setReorderingChapter(chapterId);

    const res = await fetch(`/api/admin/courses/${courseId}/chapters/${chapterId}/lessons/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonIds: next.map((l) => l.id) }),
    }).catch(() => null);
    setReorderingChapter(null);

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setLessons(previous);
      setReorderError({ chapterId, message: data?.error || "خطا در تغییر ترتیب دروس" });
    }
  }

  async function moveChapter(chapterId: string, direction: -1 | 1) {
    if (!course) return;

    const previous = course.chapters;
    const ordered = [...previous].sort((a, b) => a.order - b.order);
    const from = ordered.findIndex((ch) => ch.id === chapterId);
    const to = from + direction;
    if (from < 0 || to < 0 || to >= ordered.length) return;

    [ordered[from], ordered[to]] = [ordered[to], ordered[from]];
    const next = ordered.map((ch, index) => ({ ...ch, order: index }));

    const setChapters = (chapters: Chapter[]) =>
      setCourse((prev) => (prev ? { ...prev, chapters } : prev));

    setChapters(next);
    setChapterReorderError("");
    setMovingChapters(true);

    const res = await fetch(`/api/admin/courses/${courseId}/chapters/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chapterIds: next.map((ch) => ch.id) }),
    }).catch(() => null);
    setMovingChapters(false);

    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setChapters(previous);
      setChapterReorderError(data?.error || "خطا در تغییر ترتیب فصل‌ها");
    }
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
            <FileUpload
            label="تصویر کاور دوره"
            accept="image"
            bucket="public"
            folder="courses/covers"
            value={course.thumbnail}
            onChange={(url) => setCourse({ ...course, thumbnail: url })}
            onClear={() => setCourse({ ...course, thumbnail: null })}
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
          <div>
            <label className="block text-xs font-medium mb-1">قیمت دوره (تومان) — خالی = فقط با اشتراک</label>
            <input
              type="number"
              placeholder="مثلاً ۲,۵۰۰,۰۰۰"
              className="w-full h-10 px-3 text-sm border border-surface-container rounded-[var(--radius-input)] focus:border-primary focus:outline-none"
              value={course.price || ""}
              onChange={(e) => setCourse({ ...course, price: parseInt(e.target.value) || null })}
            />
          </div>
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

        {chapterReorderError && (
          <p className="mb-3 text-xs text-error">{chapterReorderError}</p>
        )}

        <div className="space-y-3">
          {[...course.chapters].sort((a, b) => a.order - b.order).map((chapter, chapterIndex, chapters) => (
            <div key={chapter.id} className="border border-surface-container rounded-xl overflow-hidden">
              {/* Chapter Header */}
              <div className="flex items-center gap-2 p-3 bg-surface-dim">
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  title={openChapters.has(chapter.id) ? "بستن فصل" : "باز کردن فصل"}
                  aria-label={openChapters.has(chapter.id) ? "بستن فصل" : "باز کردن فصل"}
                >
                  <ChevronDown className={cn("w-4 h-4 transition-transform", openChapters.has(chapter.id) && "rotate-180")} />
                </button>
                <span className="flex-1 text-sm font-medium">{chapter.title}</span>
                <span className="text-xs text-on-surface-muted">
                  {toPersianDigits(chapter.lessons.length)} درس
                </span>
                {/* Reorder arrows — boxed so they read as a control of their own,
                    not as a second copy of the expand/collapse chevron. */}
                <div className="flex flex-col shrink-0 rounded-lg border border-surface-container bg-white overflow-hidden">
                  <button
                    onClick={() => moveChapter(chapter.id, -1)}
                    disabled={chapterIndex === 0 || movingChapters}
                    title="انتقال فصل به بالا"
                    aria-label="انتقال فصل به بالا"
                    className="px-1 py-0.5 hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronUp className="w-3.5 h-3.5 text-on-surface-muted" />
                  </button>
                  <button
                    onClick={() => moveChapter(chapter.id, 1)}
                    disabled={chapterIndex === chapters.length - 1 || movingChapters}
                    title="انتقال فصل به پایین"
                    aria-label="انتقال فصل به پایین"
                    className="px-1 py-0.5 border-t border-surface-container hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-on-surface-muted" />
                  </button>
                </div>
                <button onClick={() => deleteChapter(chapter.id)} className="p-1 hover:bg-red-50 rounded">
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>

              {/* Lessons */}
              {openChapters.has(chapter.id) && (
                <div>
                  {reorderError?.chapterId === chapter.id && (
                    <p className="px-4 py-2 border-t border-surface-container text-xs text-error">{reorderError.message}</p>
                  )}
                  {[...chapter.lessons].sort((a, b) => a.order - b.order).map((lesson, index, lessons) =>
                    editingLesson === lesson.id ? (
                      <div key={lesson.id} className="p-3 border-t border-surface-container bg-surface-dim/50 space-y-2">
                        <input
                          placeholder="عنوان درس"
                          className="w-full h-9 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                          value={editLesson.title}
                          onChange={(e) => setEditLesson({ ...editLesson, title: e.target.value })}
                        />
                        <textarea
                          placeholder="توضیحات درس"
                          className="w-full h-20 px-3 py-2 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none resize-none"
                          value={editLesson.description}
                          onChange={(e) => setEditLesson({ ...editLesson, description: e.target.value })}
                        />
                        <div className="flex gap-2">
                          <input
                            type="number"
                            placeholder="مدت (ثانیه)"
                            className="w-28 h-9 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                            value={editLesson.duration || ""}
                            onChange={(e) => setEditLesson({ ...editLesson, duration: parseInt(e.target.value) || 0 })}
                          />
                          <label className="flex items-center gap-1 text-sm">
                            <input
                              type="checkbox"
                              checked={editLesson.isFree}
                              onChange={(e) => setEditLesson({ ...editLesson, isFree: e.target.checked })}
                              className="accent-primary"
                            />
                            رایگان
                          </label>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium">ویدیوی فعلی</p>
                          <p className="text-xs text-on-surface-muted truncate" dir="ltr">{lesson.videoUrl}</p>
                        </div>
                        <FileUpload
                          label="ویدیوی جدید (اختیاری)"
                          accept="video"
                          bucket="private"
                          folder="courses/videos"
                          value={editLesson.videoUrl || null}
                          onChange={(url) => setEditLesson({ ...editLesson, videoUrl: url })}
                          onClear={() => setEditLesson({ ...editLesson, videoUrl: "" })}
                        />
                        <div className="space-y-1">
                          <p className="text-xs font-medium">تصویر بندانگشتی فعلی</p>
                          {lesson.thumbnail ? (
                            <img src={cdnUrl(lesson.thumbnail)} alt="" className="w-32 h-20 object-cover rounded-lg border border-surface-container" />
                          ) : (
                            <p className="text-xs text-on-surface-muted">ندارد</p>
                          )}
                        </div>
                        <FileUpload
                          label="تصویر بندانگشتی جدید (اختیاری)"
                          accept="image"
                          bucket="public"
                          folder="courses/thumbnails"
                          value={editLesson.thumbnail || null}
                          onChange={(url) => setEditLesson({ ...editLesson, thumbnail: url })}
                          onClear={() => setEditLesson({ ...editLesson, thumbnail: "" })}
                        />
                        <p className="text-[10px] text-on-surface-muted">اگر فایل جدیدی انتخاب نشود، فایل فعلی حفظ می‌شود.</p>
                        {editError && <p className="text-xs text-error">{editError}</p>}
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => saveLesson(chapter.id, lesson.id)} disabled={savingLesson || !editLesson.title.trim()}>
                            {savingLesson ? "در حال ذخیره..." : "ذخیره"}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingLesson(null)}>انصراف</Button>
                        </div>
                      </div>
                    ) : (
                      <div key={lesson.id} className="flex items-center gap-3 px-4 py-2.5 border-t border-surface-container text-sm">
                        <div className="flex flex-col shrink-0">
                          <button
                            onClick={() => moveLesson(chapter.id, lesson.id, -1)}
                            disabled={index === 0 || reorderingChapter === chapter.id}
                            title="انتقال به بالا"
                            aria-label="انتقال به بالا"
                            className="p-0.5 rounded hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ChevronUp className="w-3.5 h-3.5 text-on-surface-muted" />
                          </button>
                          <button
                            onClick={() => moveLesson(chapter.id, lesson.id, 1)}
                            disabled={index === lessons.length - 1 || reorderingChapter === chapter.id}
                            title="انتقال به پایین"
                            aria-label="انتقال به پایین"
                            className="p-0.5 rounded hover:bg-primary/5 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <ChevronDown className="w-3.5 h-3.5 text-on-surface-muted" />
                          </button>
                        </div>
                        <Video className="w-4 h-4 text-on-surface-muted shrink-0" />
                        <span className="flex-1">{lesson.title}</span>
                        <span className="text-xs text-on-surface-muted">{formatDuration(lesson.duration)}</span>
                        {lesson.isFree && (
                          <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">رایگان</span>
                        )}
                        <button onClick={() => startEditLesson(lesson)} className="p-1 hover:bg-primary/5 rounded">
                          <Pencil className="w-3 h-3 text-on-surface-muted" />
                        </button>
                        <button onClick={() => deleteLesson(chapter.id, lesson.id)} className="p-1 hover:bg-red-50 rounded">
                          <Trash2 className="w-3 h-3 text-red-400" />
                        </button>
                      </div>
                    )
                  )}

                  {/* Add Lesson Form */}
                  {addingLesson === chapter.id ? (
                    <div className="p-3 border-t border-surface-container bg-surface-dim/50 space-y-2">
                      <input
                        placeholder="عنوان درس"
                        className="w-full h-9 px-3 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none"
                        value={newLesson.title}
                        onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                      />
                      <textarea
                        placeholder="توضیحات درس"
                        className="w-full h-20 px-3 py-2 text-sm border border-surface-container rounded-lg focus:border-primary focus:outline-none resize-none"
                        value={newLesson.description}
                        onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                      />
                      <FileUpload
                        label=""
                        accept="video"
                        bucket="private"
                        folder="courses/videos"
                        value={newLesson.videoUrl || null}
                        onChange={(url) => setNewLesson({ ...newLesson, videoUrl: url })}
                        onClear={() => setNewLesson({ ...newLesson, videoUrl: "" })}
                      />
                      <FileUpload
                        label="تصویر بندانگشتی"
                        accept="image"
                        bucket="public"
                        folder="courses/thumbnails"
                        value={newLesson.thumbnail || null}
                        onChange={(url) => setNewLesson({ ...newLesson, thumbnail: url })}
                        onClear={() => setNewLesson({ ...newLesson, thumbnail: "" })}
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
