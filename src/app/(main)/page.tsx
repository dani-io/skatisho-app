import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { CourseCard } from "@/components/course/course-card";

// TODO: Replace with real data from API
const MOCK_COURSES = [
  {
    id: "1",
    title: "آموزش اسکیت عمومی (پایه)",
    thumbnail: "/images/course-general.jpg",
    coachName: "مجتبی احمدی و کیمیا بروجردی",
    lessonsCount: 24,
    level: "BEGINNER" as const,
    progress: 0,
  },
  {
    id: "2",
    title: "آموزش اسکیت سرعت",
    thumbnail: "/images/course-speed.jpg",
    coachName: "امیررضا بحرینی مقدم",
    lessonsCount: 18,
    level: "INTERMEDIATE" as const,
    progress: 0,
  },
];

export default function HomePage() {
  return (
    <div className="px-4">
      {/* Header */}
      <header className="flex items-center justify-between pt-6 pb-4">
        <div>
          <h1 className="text-xl font-bold">اسکیتی‌شو</h1>
          <p className="text-sm text-on-surface-muted mt-0.5">
            دستیار تمرین اسکیت
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-surface-dim flex items-center justify-center">
          <img
            src="/icons/logo.svg"
            alt="Logo"
            className="w-6 h-6"
          />
        </div>
      </header>

      {/* Subscription Banner */}
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

      {/* Courses Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">آموزش‌ها</h2>
          <Link
            href="/courses"
            className="text-sm text-primary font-medium flex items-center gap-0.5"
          >
            مشاهده همه
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid gap-4">
          {MOCK_COURSES.map((course) => (
            <CourseCard key={course.id} {...course} />
          ))}
        </div>
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
