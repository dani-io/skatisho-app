"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface FaqCategory {
  id: string;
  title: string;
  items: FaqItem[];
}

export default function FaqPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .finally(() => setLoading(false));
  }, []);

  function toggleItem(id: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/profile"><ArrowRight className="w-5 h-5" /></Link>
        <h1 className="text-lg font-bold">سوالات متداول</h1>
      </div>

      {categories.length === 0 ? (
        <p className="text-center text-on-surface-muted py-16">سوالی ثبت نشده</p>
      ) : (
        <div className="space-y-6">
          {categories.map((cat) => (
            <div key={cat.id}>
              <h2 className="text-sm font-bold text-primary mb-3">{cat.title}</h2>
              <div className="bg-white rounded-[var(--radius-card)] border border-surface-container overflow-hidden divide-y divide-surface-container">
                {cat.items.map((item) => (
                  <div key={item.id}>
                    <button
                      onClick={() => toggleItem(item.id)}
                      className="flex items-center justify-between w-full p-4 text-right"
                    >
                      <span className="text-sm font-medium flex-1">{item.question}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-on-surface-muted shrink-0 mr-2 transition-transform",
                          openItems.has(item.id) && "rotate-180"
                        )}
                      />
                    </button>
                    {openItems.has(item.id) && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-on-surface-muted leading-relaxed">
                          {item.answer}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 bg-surface-dim rounded-[var(--radius-card)] p-4 text-center">
        <MessageCircle className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium mb-1">جواب سوالتو پیدا نکردی؟</p>
        <Link href="/tickets" className="text-xs text-primary font-medium">
          ارسال تیکت پشتیبانی ←
        </Link>
      </div>
    </div>
  );
}
