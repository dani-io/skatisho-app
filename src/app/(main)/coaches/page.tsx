"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BookOpen, Award, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

interface Coach {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  specialty: string | null;
  _count: { courses: number };
}

const SPECIALTY_COLORS: Record<string, string> = {
  "اسکیت عمومی": "bg-blue-100 text-blue-700",
  "اسکیت سرعت": "bg-red-100 text-red-700",
  "فری‌استایل": "bg-purple-100 text-purple-700",
  "اسلالوم": "bg-green-100 text-green-700",
  "هاکی": "bg-amber-100 text-amber-700",
};

export default function CoachesPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/coaches")
      .then((r) => r.json())
      .then((data) => setCoaches(data.coaches || []))
      .finally(() => setLoading(false));
  }, []);

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
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()}>
          <ArrowRight className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold">مربیان اسکیتی‌شو</h1>
      </div>

      {/* Coaches List */}
      <div className="space-y-4">
        {coaches.map((coach) => {
          const specColor = SPECIALTY_COLORS[coach.specialty || ""] || "bg-gray-100 text-gray-700";
          return (
            <Link key={coach.id} href={`/coaches/${coach.id}`}>
              <div className="bg-white rounded-[var(--radius-card)] border border-surface-container p-4 active:scale-[0.98] transition-transform">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 overflow-hidden">
                    {coach.avatar ? (
                      <img src={coach.avatar} alt={coach.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-primary">
                        {coach.name.charAt(0)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold mb-1">{coach.name}</h2>
                    {coach.specialty && (
                      <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-2 ${specColor}`}>
                        {coach.specialty}
                      </span>
                    )}
                    {coach.bio && (
                      <p className="text-xs text-on-surface-muted line-clamp-2">{coach.bio}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 text-[11px] text-on-surface-muted">
                      <BookOpen className="w-3 h-3" />
                      <span>{toPersianDigits(coach._count.courses)} دوره</span>
                    </div>
                  </div>

                  <ChevronLeft className="w-4 h-4 text-on-surface-muted shrink-0" />
                </div>
              </div>
            </Link>
          );
        })}

        {coaches.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-on-surface-muted">
            <Award className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm">مربی‌ای ثبت نشده</p>
          </div>
        )}
      </div>
    </div>
  );
}
