"use client";

import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ChevronLeft, Zap } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";
import PromotionSlider from "@/components/promotion-slider";
import { toPersianDigits } from "@/lib/utils";
import { MoodSelector, MoodButton } from "@/components/mood-selector";

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
  const [mood, setMood] = useState<string | null>(null);
  const [showMood, setShowMood] = useState(false);

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
      fetch("/api/mood").then((r) => r.json()).then((d) => setMood(d.mood));
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
        <div className="flex items-center gap-2">
        <MoodButton mood={mood} onClick={() => setShowMood(true)} />
          <NotificationBell />
          <div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center">
          <img src="/icons/logo.svg" alt="Logo" className="w-6 h-6" />
          </div>
        </div>
      </header>

      {/* Subscription Banner */}
      {hasSubscription ? (
        <div className="bg-gradient-to-l from-success to-green-600 rounded-[var(--radius-card)] px-4 py-3 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white">اشتراک فعال</span>
            <span className="text-xs text-white/80">({user?.subscription?.plan.title})</span>
          </div>
          <Link href="/subscription" className="text-xs text-white/90 font-medium">جزئیات ←</Link>
        </div>
      ) : (
        <Link href="/subscription" className="block mb-6">
          <div className="bg-gradient-to-l from-primary to-primary-dark rounded-[var(--radius-card)] px-4 py-3 flex items-center justify-between">
            <span className="text-sm font-bold text-on-surface">بدون اشتراک فعال</span>
            <span className="text-xs bg-black/10 text-on-surface px-3 py-1 rounded-full font-medium">خرید اشتراک ←</span>
          </div>
        </Link>
      )}

      {/* Promotion Slider */}
      <PromotionSlider />

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
      <MoodSelector
        isOpen={showMood}
        onClose={() => setShowMood(false)}
        currentMood={mood}
        onSelect={async (m) => {
          setMood(m);
          await fetch("/api/mood", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mood: m }),
          });
        }}
      />
    </div>
  );
}
