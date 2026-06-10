"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  bg: string;
  icon: string;
  href: string;
}

const slides: Slide[] = [
  { id: 1, title: "دوره جدید اسپید", subtitle: "۴۰٪ تخفیف", bg: "from-purple-500 to-pink-500", icon: "⚡", href: "/courses" },
  { id: 2, title: "تجهیزات اسکیت", subtitle: "حراج زمستانه", bg: "from-blue-500 to-cyan-500", icon: "🛍️", href: "/shop" },
  { id: 3, title: "مربی حرفه‌ای", subtitle: "رزرو وقت", bg: "from-amber-500 to-orange-500", icon: "👨‍🏫", href: "/coaches" },
];

export default function PromotionSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const slideWidth = useRef(0);

  useEffect(() => {
    if (!scrollRef.current) return;
    slideWidth.current = scrollRef.current.clientWidth;
  }, []);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      const next = (activeIndex + 1) % slides.length;
      setActiveIndex(next);
      scrollRef.current?.children[next]?.scrollIntoView({
        behavior: "smooth",
        inline: "start",
        block: "nearest",
      });
    }, 4000);
    return () => clearInterval(timer);
  }, [activeIndex, isPaused]);

  function handleScroll() {
    if (!scrollRef.current) return;
    const left = scrollRef.current.scrollLeft;
    const w = scrollRef.current.clientWidth;
    const index = Math.round(left / w);
    if (index !== activeIndex) {
      setActiveIndex(index);
    }
  }

  function goTo(index: number) {
    setActiveIndex(index);
    scrollRef.current?.children[index]?.scrollIntoView({
      behavior: "smooth",
      inline: "start",
      block: "nearest",
    });
  }

  return (
    <div className="mb-6">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="flex overflow-x-auto snap-x snap-mandatory rounded-[var(--radius-card)] h-[84px]"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {slides.map((slide) => (
          <Link
            key={slide.id}
            href={slide.href}
            className={`snap-start min-w-full bg-gradient-to-l ${slide.bg} p-4 flex items-center gap-3`}
          >
            <span className="text-2xl shrink-0">{slide.icon}</span>
            <div>
              <p className="text-sm font-bold text-white">{slide.title}</p>
              <p className="text-xs text-white/80 mt-0.5">{slide.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all ${
              i === activeIndex
                ? "w-4 h-2 bg-primary"
                : "w-2 h-2 bg-surface-container"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
