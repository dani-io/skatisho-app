"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  PlayCircle,
  Award,
  Layers,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";

interface CourseInfo {
  id: string;
  title: string;
  thumbnail: string | null;
  level: string;
  category: string;
  chaptersCount: number;
  lessonsCount: number;
}

interface Coach {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  specialty: string | null;
  coursesCount: number;
  courses: CourseInfo[];
}

const LEVEL_MAP: Record<string, { label: string; color: string }> = {
  BEGINNER: { label: "مبتدی", color: "bg-green-100 text-green-700" },
  INTERMEDIATE: { label: "متوسط", color: "bg-blue-100 text-blue-700" },
  ADVANCED: { label: "پیشرفته", color: "bg-red-100 text-red-700" },
};

export default function CoachProfilePage({ params }: { params: Promise<{ coachId: string }> }) {
  const { coachId } = use(params);
  const router = useRouter();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/coaches/${coachId}`)
      .then((r) => r.json())
      .then((data) => setCoach(data.coach))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-sm text-on-surface-muted">مربی یافت نشد</p>
      </div>
    );
  }

  const totalLessons = coach.courses.reduce((acc, c) => acc + c.lessonsCount, 0);

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="relative">
        <div className="h-32 bg-gradient-to-bl from-primary/30 via-primary/10 to-transparent" />
        <button
          onClick={() => router.back()}
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="px-4 -mt-12">
        <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-sm overflow-hidden mx-auto">
          {coach.avatar ? (
            <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-3xl font-bold text-primary">
                {coach.name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        <div className="text-center mt-4">
          <h1 className="text-xl font-bold">{coach.name}</h1>
          {coach.specialty && (
            <span className="inline-block text-xs text-primary font-medium mt-1">
              {coach.specialty}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-6 mt-5">
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold">{toPersianDigits(coach.coursesCount)}</p>
            <p className="text-[10px] text-on-surface-muted">دوره</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-1">
              <PlayCircle className="w-4 h-4 text-primary" />
            </div>
            <p className="text-lg font-bold">{toPersianDigits(totalLessons)}</p>
            <p className="text-[10px] text-on-surface-muted">درس</p>
          </div>
        </div>

        {/* Bio */}
        {coach.bio && (
          <div className="mt-6 bg-white rounded-[var(--radius-card)] border border-surface-container p-4">
            <h2 className="text-sm font-bold mb-2">درباره مربی</h2>
            <p className="text-xs text-on-surface-muted leading-relaxed">{coach.bio}</p>
          </div>
        )}

        {/* Courses */}
        <div className="mt-6">
          <h2 className="text-sm font-bold mb-3">دوره‌های {coach.name}</h2>
          {coach.courses.length > 0 ? (
            <div className="space-y-3">
              {coach.courses.map((course) => {
                const levelInfo = LEVEL_MAP[course.level] || LEVEL_MAP.BEGINNER;
                return (
                  <Link key={course.id} href={`/courses/${course.id}`}>
                    <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden active:scale-[0.98] transition-transform">
                      {/* Thumbnail */}
                      <div className="h-32 bg-surface-dim relative">
                        {course.thumbnail ? (
                          <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-on-surface-muted/20" />
                          </div>
                        )}
                        <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full font-medium ${levelInfo.color}`}>
                          {levelInfo.label}
                        </span>
                      </div>
                      {/* Info */}
                      <div className="p-3">
                        <h3 className="text-sm font-bold mb-2">{course.title}</h3>
                        <div className="flex items-center gap-4 text-[11px] text-on-surface-muted">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3 h-3" />
                            {toPersianDigits(course.chaptersCount)} فصل
                          </span>
                          <span className="flex items-center gap-1">
                            <PlayCircle className="w-3 h-3" />
                            {toPersianDigits(course.lessonsCount)} درس
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-muted text-center py-8">
              هنوز دوره‌ای ثبت نشده
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
