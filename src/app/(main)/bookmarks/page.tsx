"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, StickyNote } from "lucide-react";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/bookmarks")
      .then((r) => r.json())
      .then((d) => setBookmarks(d.bookmarks || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile"><ArrowRight className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold">نشان‌شده‌ها</h1>
        <span className="text-xs text-on-surface-muted mr-auto">{toPersianDigits(bookmarks.length)} درس</span>
      </div>

      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-muted">
          <Bookmark className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">درسی نشان نشده</p>
          <p className="text-xs mt-1">از صفحه هر درس می‌تونی نشانش کنی</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookmarks.map((bm: any) => (
            <Link key={bm.id} href={`/courses/${bm.lesson.chapter.course.id}/${bm.lessonId}`}
              className="flex items-center gap-3 bg-white rounded-[var(--radius-card)] border border-surface-container p-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Bookmark className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{bm.lesson.title}</p>
                <p className="text-[11px] text-on-surface-muted truncate">
                  {bm.lesson.chapter.course.title} — {bm.lesson.chapter.title}
                </p>
                {bm.note && (
                  <p className="text-[11px] text-primary mt-1 flex items-center gap-1">
                    <StickyNote className="w-3 h-3" /> {bm.note.substring(0, 50)}{bm.note.length > 50 ? "..." : ""}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
