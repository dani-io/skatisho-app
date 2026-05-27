"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LessonDetail {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: number;
  chapter: { title: string; course: { id: string; title: string } };
}

export default function LessonPage() {
  const { courseId, lessonId } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
      .then((r) => r.json())
      .then((data) => {
        setLesson(data.lesson);
        setCompleted(data.completed || false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
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
    <div className="pb-6">
      {/* Video Player */}
      <div className="relative bg-black aspect-video">
        <video
          ref={videoRef}
          src={lesson.videoUrl}
          controls
          playsInline
          className="w-full h-full"
          onEnded={markComplete}
        />
      </div>

      <div className="px-4">
        {/* Back & Title */}
        <div className="flex items-center gap-3 mt-4">
          <button onClick={() => router.push(`/courses/${courseId}`)}>
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <p className="text-xs text-on-surface-muted">
              {lesson.chapter.title}
            </p>
            <h1 className="text-lg font-bold mt-0.5">{lesson.title}</h1>
          </div>
          {completed && (
            <CheckCircle2 className="w-6 h-6 text-success shrink-0" />
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
            variant="secondary"
            className="mt-6"
            onClick={markComplete}
          >
            تکمیل این درس ✓
          </Button>
        )}
      </div>
    </div>
  );
}
