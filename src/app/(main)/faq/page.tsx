"use client";

import { useState } from "react";
import { ArrowRight, ChevronDown, MessageCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = [
  {
    title: "دسترسی و اپلیکیشن",
    items: [
      {
        q: "اسکیتی‌شو چیه؟",
        a: "اسکیتی‌شو اولین اپلیکیشن ایرانی آموزش اسکیت هست که با محتوای ویدئویی فارسی و پشتیبانی مربیان حرفه‌ای، مسیر یادگیری رو ساختارمند و سریع‌تر می‌کنه.",
      },
      {
        q: "روی چه دستگاه‌هایی کار می‌کنه؟",
        a: "اسکیتی‌شو یه وب‌اپ (PWA) هست و روی همه گوشی‌ها، تبلت‌ها و کامپیوترها از طریق مرورگر کار می‌کنه. همچنین می‌تونید به هوم‌اسکرین گوشیتون اضافه‌ش کنید.",
      },
      {
        q: "آیا اینترنت برای استفاده لازمه؟",
        a: "بله، برای پخش ویدئوها نیاز به اینترنت دارید. ولی صفحات اپ به‌صورت آفلاین هم قابل مشاهده هستن.",
      },
    ],
  },
  {
    title: "اشتراک و پرداخت",
    items: [
      {
        q: "پلن‌های اشتراک چطوریه؟",
        a: "چهار پلن داریم: ماهانه، سه ماهه، شش ماهه و سالانه. با خرید اشتراک به تمام دوره‌ها و ویدئوها دسترسی نامحدود دارید.",
      },
      {
        q: "آیا دروس رایگان هم وجود داره؟",
        a: "بله! اولین دروس هر دوره رایگان هستن تا بتونید کیفیت آموزش‌ها رو ببینید.",
      },
      {
        q: "نحوه پرداخت چطوریه؟",
        a: "پرداخت از طریق درگاه بانکی زرین‌پال انجام میشه. تمام کارت‌های بانکی عضو شتاب پشتیبانی میشن.",
      },
    ],
  },
  {
    title: "آموزش و مربیان",
    items: [
      {
        q: "مربیان چه سابقه‌ای دارن؟",
        a: "مربیان اسکیتی‌شو اعضای کمیته فنی فدراسیون اسکیت، قهرمانان کشوری و مربیان با تجربه هستن.",
      },
      {
        q: "مناسب چه سنی هست؟",
        a: "آموزش‌ها برای تمام سنین طراحی شدن. از کودکان ۵ سال به بالا تا بزرگسالان می‌تونن استفاده کنن.",
      },
      {
        q: "آیا می‌تونم سؤال بپرسم؟",
        a: "بله! با خرید اشتراک، امکان ارسال تیکت و ارتباط مستقیم با مربیان رو دارید.",
      },
    ],
  },
];

export default function FaqPage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  function toggle(key: string) {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/"><ArrowRight className="w-6 h-6" /></Link>
        <h1 className="text-lg font-bold">سوالات متداول</h1>
      </div>

      <div className="space-y-6">
        {FAQ_CATEGORIES.map((cat) => (
          <div key={cat.title}>
            <h2 className="font-bold text-sm mb-3 text-primary">{cat.title}</h2>
            <div className="space-y-2">
              {cat.items.map((item, i) => {
                const key = `${cat.title}-${i}`;
                const isOpen = openItems.has(key);

                return (
                  <div
                    key={key}
                    className="bg-white border border-surface-container rounded-[var(--radius-card)] overflow-hidden"
                  >
                    <button
                      onClick={() => toggle(key)}
                      className="w-full flex items-center justify-between p-4 text-right"
                    >
                      <span className="text-sm font-medium">{item.q}</span>
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-on-surface-muted shrink-0 transition-transform",
                          isOpen && "rotate-180"
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 animate-fade-in">
                        <p className="text-sm text-on-surface-muted leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Contact CTA */}
      <div className="mt-8 bg-primary/10 rounded-[var(--radius-card)] p-5 text-center">
        <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
        <p className="font-bold text-sm mb-1">جوابتو پیدا نکردی؟</p>
        <p className="text-xs text-on-surface-muted mb-3">از طریق پشتیبانی با ما در ارتباط باش</p>
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1 bg-primary text-on-surface px-4 py-2 rounded-[var(--radius-button)] text-sm font-medium"
        >
          ارسال پیام
        </Link>
      </div>
    </div>
  );
}
