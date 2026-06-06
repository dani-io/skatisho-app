"use client";

import { useEffect, useState } from "react";
import { GraduationCap, BookOpen, PlayCircle, Filter } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";
import { toPersianDigits, cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  thumbnail: string | null;
  coachName: string;
  lessonsCount: number;
  level: string;
  category: string;
}

const LEVELS = [
  { id: "ALL", label: "همه" },
  { id: "BEGINNER", label: "مبتدی" },
  { id: "INTERMEDIATE", label: "متوسط" },
  { id: "ADVANCED", label: "پیشرفته" },
];

const CATEGORIES = [
  { id: "ALL", label: "همه" },
  { id: "GENERAL", label: "عمومی" },
  { id: "SPEED", label: "سرعت" },
  { id: "FREESTYLE", label: "فری‌استایل" },
  { id: "SLALOM", label: "اسلالوم" },
  { id: "HOCKEY", label: "هاکی" },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("ALL");
  const [category, setCategory] = useState("ALL");

  useEffect(() => {
    fetch("/api/courses")
      .then((r) => r.json())
      .then((data) => setCourses(data.courses || []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    if (level !== "ALL" && c.level !== level) return false;
    if (category !== "ALL" && c.category !== category) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-lg font-bold">آکادمی اسکیت</h1>
        <div className="flex items-center gap-1 text-xs text-on-surface-muted">
          <BookOpen className="w-3.5 h-3.5" />
          <span>{toPersianDigits(courses.length)} دوره</span>
        </div>
      </div>
      <p className="text-sm text-on-surface-muted mb-4">آموزش اسکیت از مبتدی تا حرفه‌ای</p>

      {/* Level Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 -mx-4 px-4">
        {LEVELS.map((l) => (
          <button key={l.id} onClick={() => setLevel(l.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors",
              level === l.id ? "bg-primary text-black" : "bg-surface-dim text-on-surface-muted"
            )}>
            {l.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4 -mx-4 px-4">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCategory(c.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-colors border",
              category === c.id
                ? "border-primary bg-primary/5 text-primary"
                : "border-surface-container text-on-surface-muted"
            )}>
            {c.label}
          </button>
        ))}
      </div>

      {/* Courses */}
      {filtered.length > 0 ? (
        <div className="space-y-4">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
          <GraduationCap className="w-12 h-12 mb-4 opacity-20" />
          <p className="text-sm">دوره‌ای با این فیلتر یافت نشد</p>
        </div>
      )}
    </div>
  );
}
