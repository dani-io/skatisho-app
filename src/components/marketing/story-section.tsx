"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The signature section. Everything else on the page stays quiet so this one
 * can be loud: full-bleed black, yellow spine, oversized pull quotes.
 *
 * Motion is deliberately restrained — a single fade/rise as each block enters
 * the viewport, nothing else. Two safety nets: `prefers-reduced-motion` pins
 * every block to its final state in CSS, and the <noscript> block below keeps
 * everything visible if JS never runs.
 */

function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, shown };
}

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-reveal
      className={cn(
        "transition-all duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
        // Reduced motion is handled in CSS, not JS, so the page also responds
        // when the OS setting is toggled after load: the final state is forced
        // and the transition removed regardless of what the observer has seen.
        "motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none",
        className
      )}
    >
      {children}
    </div>
  );
}

const ACT_ONE = [
  "من یه روزی فکر می‌کردم اسکیت یه بازی برای بچه‌هاست. رزمی‌کار بودم، قهرمان کشور در رشته‌ی ووشو. اسکیت توی ذهن من نه‌تنها ورزش نبود، حتی یه جور شوخی به حساب میومد.",
  "اون‌قدری این ذهنیت باهام بود که بعضی وقتا وسط مسیر بچه‌های اسکیت‌سوار طناب می‌کشیدم تا زمین بخورن و بهشون بخندم.",
  "ولی یه روز، یه روزی که اصلاً انتظارش رو نداشتم، همه‌چیز تغییر کرد.",
  "پدر و مادرم، دوستام و اطرافیان همه جمع شده بودن و گفتن: «تو که همیشه اسکیت‌سوارا رو مسخره می‌کنی، خودت اسکیت بپوش، ببینیم چطوریه.»",
  "منم با غرور همیشگی قبول کردم. گفتم: من که قهرمان ملی‌ام، اسکیت‌سواری که برام کاری نداره.",
  "اما سه ثانیه بعد از پوشیدن اسکیت، متوجه شدم که ستاره‌ها دارن به سمتم هجوم میارن. روی هوا معلق بودم، بعد با شدت تمام زمین خوردم و تنها چیزی که یادم میاد صدای خنده‌های اطرافم بود. وقتی بلند شدم، هنوز توی شوک بودم که یهو دیدم یه دیوار داره با سرعت به سمتم نزدیک میشه — در واقع این اسکیت‌ها بودن که کنترلشون دست من نبود و منو صاف بردن تا با دیوار یکی بشم و مثل قاب عکس بچسبم به دیوار.",
  "صدای خنده‌ی همه کسایی که اونجا بودن به گوشم می‌رسید. درد جسمی یه طرف، تحقیر شدن یه طرف دیگه.",
];

const ACT_TWO = [
  "اون شب از درد نخوابیدم. ولی تصمیمم رو گرفتم: دیگه کسی حق نداره به من بخنده. پس باید مخفیانه اسکیت رو یاد می‌گرفتم.",
  "نیمه‌شب‌ها، توی کوچه‌های خلوت، اسکیت‌های خواهرم رو می‌پوشیدم و تمرین می‌کردم. صبح زود، قبل از اینکه کسی بیدار شه، برشون می‌گردوندم سر جاشون.",
  "با اینترنت ذغالی اون زمان، فیلم‌های خارجی آموزش اسکیت رو دانلود می‌کردم، نگه می‌داشتم، و شب‌ها تمرین می‌کردم.",
  "چند هفته بعد، دوباره صدام کردن تا بهم بخندن.",
];

const ACT_THREE = [
  "با اعتمادبه‌نفس روی اسکیت حرکت می‌کردم، با تلفیق حرکات رزمی و اسکیت. همه از تعجب خشک‌شون زده بود.",
  "از همون‌جا، همه‌چیز شروع شد.",
];

const TIMELINE = [
  {
    marker: "سال ۱۳۸۷",
    title: "اولین مسابقه‌ی قهرمانی کشور",
    body: "اولین مسابقه‌ی قهرمانی کشور، تقریباً ۲۱ سالم بود. با اسکیت‌های ابتدایی و بی‌اطلاعی کامل از قوانین، رفتیم وسط قهرمان‌ها. و باز هم، صدای خنده‌ها برگشت.",
  },
  {
    marker: "نقطه‌عطف دوم",
    title: "تصمیم به ساختن یک تیم",
    body: "تمام وقت و انرژیم رو صبح و شب صرف مطالعه و تمرین کردم. تیمی ساختم که تا سال گذشته مورد تمسخر بود، اما در کمتر از یک سال مسیرش رو عوض کرد و به نایب‌قهرمانی کشور رسید.",
  },
  {
    marker: "تا سال ۱۳۹۱",
    title: "قهرمانی و نایب‌قهرمانی کشور",
    body: "تیم‌های من یا قهرمان کشور بودن یا نایب‌قهرمان. حالا دیگه اسم هرمزگان باعث خنده نبود؛ باعث افتخار بود.",
  },
  {
    marker: "۲۵ سالگی",
    title: "جوان‌ترین کمک‌مربی تیم ملی",
    body: "و من، در ۲۵ سالگی، شدم جوان‌ترین کمک‌مربی تیم ملی ایران.",
  },
  {
    marker: "سال ۱۳۹۸",
    title: "کرونا، و یک سؤال",
    body: "اومدن کرونا، همه‌چیز رو متوقف کرد. باشگاه تعطیل. ارتباط قطع. و یه سؤال توی ذهنم چرخید: اگه مربی نباشه، اگه باشگاهی نباشه، یه بچه‌ی عاشق اسکیت باید چی‌کار کنه؟",
  },
  {
    marker: "و بعد",
    title: "تولد اسکیتی‌شو",
    body: "و اون‌جا، جرقه خورد. یه اپلیکیشن. یه مربی همراه. یه فرصت برای همه. و این شد شروع «اسکیتی‌شو».",
  },
];

const CLOSING = [
  "ایده‌ی اپلیکیشن توی ذهنم جرقه زد و روز به روز بزرگ شد. و در نهایت اسکیتی‌شو تبدیل شد به یک ابزار هوشمند کمک‌تمرینی که باعث تقویت مربیان خوب می‌شه، ورزشکاران رو سریع‌تر به اهدافشون می‌رسونه و تمرین‌ها رو شفاف و هدفمند می‌کنه.",
  "«اسکیتی‌شو» فقط یه اپ نیست، بلکه یه ابزار کمک‌آموزشی و مربی همراهه — یه راه برای دسترسی به آموزش حرفه‌ای، منظم و قدم‌به‌قدم، برای هرکسی توی هر نقطه‌ی ایران.",
  "از دل مسخره‌شدن، درد، زمین‌خوردن و بلند شدن ساخته شد. با عشق، با زحمت، با هزینه، ولی با افتخار.",
  "اسکیتی‌شو یه اپ نیست؛ یه قولِ جدیه به همه‌ی اوناییه که یه روزی، یه طناب جلوی راهشون کشیده شده. قولی برای اینکه یاد بگیری، قوی شی و بخندی… نه به بقیه، بلکه از ته دل، به مسیر خودت.",
  "اسکیتی‌شو تنها اپلیکیشن کمک‌آموزشی اسکیت ایرانی است و من در تلاشم که اونو به مرجعی برای همه‌ی مربیان و ورزشکاران اسکیت در ایران و کشورهای منطقه تبدیل کنم.",
];

function Paragraphs({ items }: { items: string[] }) {
  return (
    <div className="space-y-5">
      {items.map((text) => (
        <p key={text.slice(0, 24)} className="text-base leading-loose text-white/70 md:text-lg">
          {text}
        </p>
      ))}
    </div>
  );
}

function PullQuote({ children }: { children: React.ReactNode }) {
  return (
    <Reveal className="my-12 md:my-16">
      <blockquote className="border-s-4 border-primary ps-6 md:ps-8">
        <p className="text-3xl leading-tight font-bold text-primary md:text-5xl">
          {children}
        </p>
      </blockquote>
    </Reveal>
  );
}

export function StorySection() {
  return (
    <section id="story" className="scroll-mt-20 bg-black px-5 py-20 text-white md:py-28">
      <noscript>
        {/* Without JS the reveal never runs — keep everything visible. */}
        <style>{`[data-reveal]{opacity:1 !important;transform:none !important}`}</style>
      </noscript>

      <div className="mx-auto w-full max-w-[820px]">
        {/* Header */}
        <Reveal>
          <p className="mb-3 text-sm font-bold tracking-[0.2em] text-primary">
            داستان اسکیتی‌شو
          </p>
          <h2 className="text-3xl leading-tight font-bold md:text-5xl">
            از تمسخر تا تحول
          </h2>
          <p className="mt-6 inline-block bg-primary px-4 py-2 text-base font-bold text-on-surface md:text-lg">
            داستان تولد اسکیتی‌شو
          </p>
        </Reveal>

        {/* Intro + portrait */}
        <Reveal className="mt-14">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start">
            {/*
              TODO: replace with the real photo of رضا نظری when the asset lands
              (drop it in /public/images and swap this block for an <img>).
              Placeholder is non-blocking so the build never depends on it.
            */}
            <div
              className="flex h-40 w-40 shrink-0 items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed border-white/25 p-4 text-center text-xs leading-relaxed text-white/50"
              role="img"
              aria-label="عکس رضا نظری، بنیان‌گذار اسکیتی‌شو"
            >
              عکس رضا نظری
            </div>

            <div className="space-y-5">
              <p className="text-lg leading-loose font-bold text-white md:text-xl">
                من رضا نظری هستم — بنیان‌گذار اپلیکیشن اسکیتی‌شو، پلتفرمی که از
                دل یک تجربه‌ی واقعی، زمین‌خوردن‌ها، تلاش‌ها و رویاها شکل گرفت.
              </p>
              <p className="text-base leading-loose text-white/70 md:text-lg">
                بریم و داستان منو با هم بشنویم.
              </p>
            </div>
          </div>
        </Reveal>

        <Reveal className="mt-14">
          <Paragraphs items={ACT_ONE} />
        </Reveal>

        <PullQuote>دیگه کسی حق نداره به من بخنده</PullQuote>

        <Reveal>
          <Paragraphs items={ACT_TWO} />
        </Reveal>

        <PullQuote>ولی این بار، کسی نخندید</PullQuote>

        <Reveal>
          <Paragraphs items={ACT_THREE} />
        </Reveal>

        <PullQuote>من شدم «رضا اسکیتی»</PullQuote>

        <Reveal>
          <Paragraphs
            items={[
              "اسکیت شد بخشی از زندگیم. هر عصر توی پارک تمرین می‌کردم، به دیگران آموزش می‌دادم. مربی شدم. تیم ساختم. مسابقات کشوری رفتیم.",
            ]}
          />
        </Reveal>

        {/* Turning points — the spine of the section */}
        <div className="mt-16 md:mt-20">
          <Reveal>
            <h3 className="mb-10 text-sm font-bold tracking-[0.2em] text-primary">
              نقطه‌عطف‌ها
            </h3>
          </Reveal>

          {/* ps-8 is fixed (not responsive) so the marker offset below stays aligned. */}
          <ol className="border-s-2 border-white/15 ps-8">
            {TIMELINE.map((item, i) => (
              <li key={item.marker} className={cn("relative", i > 0 && "mt-12")}>
                {/* Centres the 0.75rem dot on the 2px spine: -(ps-8) - half the dot. */}
                <span
                  aria-hidden="true"
                  className="absolute top-2 h-3 w-3 rounded-full bg-primary ring-4 ring-black"
                  style={{ insetInlineStart: "calc(-2rem - 0.375rem)" }}
                />
                <Reveal>
                  <p className="text-sm font-bold text-primary">{item.marker}</p>
                  <h4 className="mt-2 text-xl font-bold md:text-2xl">{item.title}</h4>
                  <p className="mt-3 text-base leading-loose text-white/70">
                    {item.body}
                  </p>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>

        <Reveal className="mt-16 md:mt-20">
          <Paragraphs items={CLOSING} />
        </Reveal>
      </div>
    </section>
  );
}
