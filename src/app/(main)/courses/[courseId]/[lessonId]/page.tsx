"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "@/components/player/video-player";

interface LessonDetail {
  id: string;
  title: string;
  description: string | null;
  videoUrl: string;
  duration: number;
  chapter: { title: string; course: { id: string; title: string } };
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
      .then((r) => {
        if (r.status === 403) {
          setError("برای مشاهده این درس، اشتراک فعال نیاز دارید");
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setLesson(data.lesson);
          setCompleted(data.completed || false);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  async function markComplete() {
    await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    setCompleted(true);
  }

  async function saveProgress(seconds: number) {
    await fetch(`/api/courses/${courseId}/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: false, watchedSec: seconds }),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 px-6 text-center">
        <p className="text-on-surface-muted">{error}</p>
        <Button onClick={() => router.push("/subscription")}>
          خرید اشتراک
        </Button>
        <Button variant="ghost" onClick={() => router.push(`/courses/${courseId}`)}>
          بازگشت به دوره
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-on-surface-muted">درس یافت نشد</p>
        <Button variant="outline" onClick={() => router.back()}>
          بازگشت
        </Button>
      </div>
    );
  }

  return (
    <div className="pb-24">
      {/* Video Player */}
      <VideoPlayer
        src={lesson.videoUrl}
        onEnded={markComplete}
        onProgress={saveProgress}
      />

      <div className="px-4">
        {/* Back & Title */}
        <div className="flex items-start gap-3 mt-4">
          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="mt-1"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-on-surface-muted">
              {lesson.chapter.title}
            </p>
            <h1 className="text-lg font-bold mt-0.5 leading-relaxed">
              {lesson.title}
            </h1>
          </div>
          {completed && (
            <CheckCircle2 className="w-6 h-6 text-success shrink-0 mt-1" />
          )}
        </div>

        {/* Description */}
        {lesson.description && (
          <p className="mt-4 text-sm text-on-surface-muted leading-relaxed">
            {lesson.description}
          </p>
        )}

        {/* Mark Complete Button */}
        {!completed && (
          <Button
            size="full"
            className="mt-6"
            onClick={markComplete}
          >
            تکمیل این درس ✓
          </Button>
        )}

        {completed && (
          <div className="mt-6 bg-success/10 text-success text-sm font-medium text-center py-3 rounded-[var(--radius-card)]">
            ✓ این درس تکمیل شده
          </div>
        )}
      </div>
    </div>
  );
}
