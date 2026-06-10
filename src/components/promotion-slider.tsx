"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { fileUrl } from "@/lib/storage";

interface Slide {
  id: string;
  title: string | null;
  link: string | null;
  imageKey: string;
}

export default function PromotionSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/banners")
      .then((r) => r.json())
      .then((d) => {
        setSlides(d.banners || []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isPaused || slides.length === 0) return;
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
  }, [activeIndex, isPaused, slides.length]);

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

  if (loading || slides.length === 0) return null;

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
            href={slide.link || "#"}
            className="snap-start min-w-full rounded-[var(--radius-card)] overflow-hidden relative h-[84px] block"
          >
            <img
              src={fileUrl(slide.imageKey)}
              alt={slide.title || ""}
              className="absolute inset-0 w-full h-full object-cover"
            />
            {slide.title && (
              <div className="absolute inset-0 bg-gradient-to-l from-black/50 to-transparent p-4 flex flex-col justify-center">
                <p className="text-sm font-bold text-white">{slide.title}</p>
              </div>
            )}
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
