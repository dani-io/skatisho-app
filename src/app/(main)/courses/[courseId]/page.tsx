"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  Play,
  Lock,
  Clock,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDuration, toPersianDigits, formatPrice } from "@/lib/utils";
import Link from "next/link";

interface Lesson {
  id: string;
  title: string;
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

interface CourseDetail {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  level: string;
  coach: { name: string; bio: string; avatar: string };
  chapters: Chapter[];
  hasAccess: boolean;
  hasVIP: boolean;
  hasPurchased: boolean;
  price: number | null;
  progress: Record<string, boolean>;
}

const levelMap: Record<string, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
};

export default function CourseDetailPage() {
  const { courseId } = useParams();
  const router = useRouter();
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/courses/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setCourse(data.course);
        // Open first chapter by default
        if (data.course?.chapters?.[0]) {
          setOpenChapters(new Set([data.course.chapters[0].id]));
        }
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  function toggleChapter(id: string) {
    setOpenChapters((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleLessonClick(lesson: Lesson) {
    if (lesson.isFree || course?.hasAccess) {
      router.push(`/courses/${courseId}/${lesson.id}`);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-on-surface-muted">دوره یافت نشد</p>
        <Button variant="outline" onClick={() => router.push("/")}>
          بازگشت
        </Button>
      </div>
    );
  }

  const totalLessons = course.chapters.reduce(
    (acc, ch) => acc + ch.lessons.length,
    0
  );
  const completedLessons = Object.values(course.progress).filter(Boolean).length;

  return (
    <div className="pb-6">
      {/* Header */}
      <div className="relative">
        <div className="aspect-video bg-surface-dim">
          {course.thumbnail && (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="w-full h-full object-cover"
            />
          )}
        </div>
        <Link
          href="/"
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>

      <div className="px-4">
        {/* Title & Meta */}
        <div className="mt-4">
          <h1 className="text-xl font-bold leading-relaxed">{course.title}</h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-on-surface-muted">
            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
              {levelMap[course.level]}
            </span>
            <span>{toPersianDigits(totalLessons)} درس</span>
            <span>مربی: {course.coach.name}</span>
          </div>
        </div>

        {/* Progress (if has access) */}
        {course.hasAccess && totalLessons > 0 && (
          <div className="mt-4 bg-surface-dim rounded-[var(--radius-card)] p-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium">پیشرفت شما</span>
              <span className="text-on-surface-muted">
                {toPersianDigits(completedLessons)} از {toPersianDigits(totalLessons)}
              </span>
            </div>
            <div className="h-2 bg-surface-container rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{
                  width: `${(completedLessons / totalLessons) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
        
        {/* Description */}
        {course.description && (
          <p className="mt-4 text-sm text-on-surface-muted leading-relaxed">
            {course.description}
          </p>
        )}

        {/* Buy CTA (if no access) */}
        {!course.hasAccess && (
          <div className="mt-4 space-y-3">
            {course.price && (
              <div className="bg-primary/10 rounded-[var(--radius-card)] p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold">خرید این دوره</p>
                  <p className="text-lg font-bold text-primary">{formatPrice(course.price)}</p>
                </div>
                <Button
                  size="full"
                  onClick={async () => {
                    const res = await fetch(`/api/courses/${courseId}/purchase`, { method: "POST" });
                    const data = await res.json();
                    if (data.success) {
                      setCourse((prev: any) => prev ? { ...prev, hasAccess: true, hasPurchased: true } : prev);
                    } else if (res.status === 402) {
                      alert(`موجودی کافی نیست. نیاز: ${data.needed?.toLocaleString()} تومان — موجودی: ${data.balance?.toLocaleString()} تومان`);
                      router.push("/profile");
                    } else {
                      alert(data.error);
                    }
                  }}
                >
                  خرید دوره — {formatPrice(course.price)}
                </Button>
              </div>
            )}
            <div className="bg-surface-dim rounded-[var(--radius-card)] p-4">
              <p className="text-sm font-medium mb-3">
                {course.price ? "یا با اشتراک VIP به تمام دوره‌ها دسترسی داشته باشید" : "برای دسترسی به تمام دروس، اشتراک VIP تهیه کنید"}
              </p>
              <Button
                size="full"
                variant="outline"
                onClick={() => router.push("/subscription")}
              >
                خرید اشتراک VIP
              </Button>
            </div>
          </div>
        )}

        {/* Chapters & Lessons */}
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-3">سرفصل‌ها</h2>

          <div className="space-y-2">
            {course.chapters.map((chapter) => (
              <div
                key={chapter.id}
                className="border border-surface-container rounded-[var(--radius-card)] overflow-hidden"
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-dim transition-colors"
                >
                  <span className="font-medium text-sm">{chapter.title}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-on-surface-muted">
                      {toPersianDigits(chapter.lessons.length)} درس
                    </span>
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 transition-transform",
                        openChapters.has(chapter.id) && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {/* Lessons */}
                {openChapters.has(chapter.id) && (
                  <div className="border-t border-surface-container">
                    {chapter.lessons.map((lesson) => {
                      const isCompleted = course.progress[lesson.id];
                      const canPlay = lesson.isFree || course.hasAccess;

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => handleLessonClick(lesson)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 text-right transition-colors",
                            canPlay
                              ? "hover:bg-surface-dim"
                              : "opacity-60"
                          )}
                        >
                          {/* Icon */}
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                          ) : canPlay ? (
                            <Play className="w-5 h-5 text-primary shrink-0" />
                          ) : (
                            <Lock className="w-5 h-5 text-on-surface-muted shrink-0" />
                          )}

                          {/* Title */}
                          <span className="flex-1 text-sm">{lesson.title}</span>

                          {/* Duration */}
                          <div className="flex items-center gap-1 text-xs text-on-surface-muted">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{formatDuration(lesson.duration)}</span>
                          </div>

                          {/* Free badge */}
                          {lesson.isFree && !course.hasAccess && (
                            <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">
                              رایگان
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
