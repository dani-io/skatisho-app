"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, Zap } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";
import { toPersianDigits } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  thumbnail: string | null;
  coachName: string;
  lessonsCount: number;
  level: string;
  category: string;
}

interface UserInfo {
  name: string | null;
  subscription: { isActive: boolean; plan: { title: string }; endDate: string } | null;
}

export default function HomePage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/auth/me").then((r) => r.json()),
    ])
      .then(([coursesData, userData]) => {
        setCourses(coursesData.courses || []);
        setUser(userData.user || null);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasSubscription = user?.subscription?.isActive && 
    new Date(user.subscription.endDate) > new Date();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold">
            {user?.name ? `سلام ${user.name}` : "اسکیتی‌شو"}
          </h1>
          <p className="text-sm text-on-surface-muted mt-0.5">
            دستیار تمرین اسکیت
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center">
          <img src="/icons/logo.svg" alt="Logo" className="w-6 h-6" />
        </div>
      </header>

      {/* Subscription Banner */}
      {hasSubscription ? (
        <div className="bg-gradient-to-l from-success to-green-600 rounded-[var(--radius-card)] p-4 mb-6">
          <p className="text-sm font-medium text-white">اشتراک فعال</p>
          <p className="text-lg font-bold text-white mt-1">
            {user?.subscription?.plan.title}
          </p>
        </div>
      ) : (
        <div className="bg-gradient-to-l from-primary to-primary-dark rounded-[var(--radius-card)] p-4 mb-6">
          <p className="text-sm font-medium text-on-surface">
            وضعیت اشتراک شما
          </p>
          <p className="text-lg font-bold text-on-surface mt-1">
            بدون اشتراک فعال
          </p>
          <Link
            href="/subscription"
            className="inline-flex items-center gap-1 mt-3 bg-on-surface text-white px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium"
          >
            خرید اشتراک
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Special Offer Banner (new users) */}
      {!hasSubscription && (
        <Link href="/subscription" className="block mb-4">
          <div className="bg-gradient-to-l from-red-500 to-orange-500 rounded-[var(--radius-card)] p-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4" />
              <span className="font-bold text-sm">۴۰٪ تخفیف + ۷ روز رایگان!</span>
            </div>
            <p className="text-xs opacity-90">
              همین الان اشتراک بگیر و آموزش اسکیت رو شروع کن
            </p>
          </div>
        </Link>
      )}

      {/* Courses */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">آموزش‌ها</h2>
        </div>

        {courses.length === 0 ? (
          <p className="text-center text-on-surface-muted py-8">
            دوره‌ای یافت نشد
          </p>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <CourseCard key={course.id} {...course} />
            ))}
          </div>
        )}
      </section>

      {/* Quick Access */}
      <section className="mt-8 mb-6">
        <h2 className="text-lg font-bold mb-4">دسترسی سریع</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "مربیان", href: "/coaches", emoji: "👨‍🏫" },
            { label: "فروشگاه", href: "/shop", emoji: "🛍️" },
            { label: "سوالات متداول", href: "/faq", emoji: "❓" },
            { label: "معرفی به دوستان", href: "/referral", emoji: "🎁" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-surface-dim rounded-[var(--radius-card)] p-4 hover:bg-surface-container transition-colors"
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
