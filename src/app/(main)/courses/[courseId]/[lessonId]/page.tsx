"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Bookmark,
  BookmarkCheck,
  StickyNote,
  Send,
  MessageSquare,
} from "lucide-react";
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
  const [bookmarked, setBookmarked] = useState(false);
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const [showNote, setShowNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // Load lesson
  useEffect(() => {
    fetch(`/api/courses/${courseId}/lessons/${lessonId}`)
      .then((r) => {
        if (r.status === 403) {
          setError("برای مشاهده این درس، اشتراک فعال نیاز دارید");
          setLoading(false);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) {
          setLesson(data.lesson);
          setCompleted(data.completed);
        }
      })
      .finally(() => setLoading(false));
  }, [courseId, lessonId]);

  // Load bookmark status
  useEffect(() => {
    if (!lessonId) return;
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((data) => {
        const bm = (data.bookmarks || []).find(
          (b: any) => b.lessonId === lessonId
        );
        if (bm) {
          setBookmarked(true);
          setNote(bm.note || "");
          setSavedNote(bm.note || "");
        }
      });
  }, [lessonId]);

  async function toggleBookmark() {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId }),
    });
    const data = await res.json();
    setBookmarked(data.action !== "removed");
    if (data.action === "removed") {
      setNote("");
      setSavedNote("");
      setShowNote(false);
    }
  }

  async function saveNoteHandler() {
    setSavingNote(true);
    try {
      await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId, note }),
      });
      setSavedNote(note);
      if (!bookmarked) setBookmarked(true);
    } finally {
      setSavingNote(false);
    }
  }

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
      body: JSON.stringify({ watchedSec: seconds }),
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
        <Button
          variant="ghost"
          onClick={() => router.push(`/courses/${courseId}`)}
        >
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
    <div className="pb-24 pt-4 px-4">
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

        {/* Bookmark & Note */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={toggleBookmark}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              bookmarked
                ? "border-primary bg-primary/5 text-primary"
                : "border-surface-container text-on-surface-muted"
            }`}
          >
            {bookmarked ? (
              <BookmarkCheck className="w-4 h-4" />
            ) : (
              <Bookmark className="w-4 h-4" />
            )}
            {bookmarked ? "نشان شده" : "نشان کردن"}
          </button>
          <button
            onClick={() => setShowNote(!showNote)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showNote || savedNote
                ? "border-primary bg-primary/5 text-primary"
                : "border-surface-container text-on-surface-muted"
            }`}
          >
            <StickyNote className="w-4 h-4" />
            یادداشت
          </button>
        </div>

        {showNote && (
          <div className="mt-3 bg-surface-dim rounded-[var(--radius-card)] p-3">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="یادداشت خود را بنویسید..."
              rows={3}
              className="w-full bg-white border border-surface-container rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-on-surface-muted">
                {note !== savedNote
                  ? "ذخیره نشده"
                  : note
                  ? "ذخیره شده ✓"
                  : ""}
              </span>
              <Button
                variant="secondary"
                onClick={saveNoteHandler}
                disabled={savingNote || note === savedNote}
              >
                {savingNote ? (
                  "..."
                ) : (
                  <>
                    <Send className="w-3 h-3 ml-1" />
                    ذخیره
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Support Button */}
        <button
          onClick={() => router.push(`/tickets/new?lessonId=${lessonId}&subject=${encodeURIComponent("سوال درباره: " + lesson.title)}`)}
          className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-xs font-medium border border-surface-container text-on-surface-muted hover:border-primary hover:text-primary transition-colors w-full justify-center"
        >
          <MessageSquare className="w-4 h-4" />
          سوال درباره این درس؟ پشتیبانی
        </button>
        
        {/* Description */}
        {lesson.description && (
          <p className="mt-4 text-sm text-on-surface-muted leading-relaxed">
            {lesson.description}
          </p>
        )}

        {/* Mark Complete Button */}
        {!completed && (
          <Button size="full" className="mt-6" onClick={markComplete}>
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