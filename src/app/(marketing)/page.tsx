import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { cdnUrl } from "@/lib/storage";
import {
  LandingFooter,
  LandingHeader,
} from "@/components/marketing/landing-chrome";
import {
  CoachesSection,
  type LandingCoach,
} from "@/components/marketing/coaches-section";
import {
  FaqSection,
  type LandingFaqCategory,
} from "@/components/marketing/faq-section";
import { StorySection } from "@/components/marketing/story-section";
import {
  About,
  Endorsement,
  Features,
  FinalCta,
  Hero,
  Referral,
  TrainingStyles,
} from "@/components/marketing/sections";

export const metadata: Metadata = {
  title: "اسکیتی‌شو | دستیار تمرین اسکیت",
  description:
    "اسکیتی‌شو یک ابزار کمک‌آموزشی اسکیت است که کنار تمرین‌های شما قرار می‌گیرد تا مسیر یادگیری اسکیت شفاف‌تر، منظم‌تر و سریع‌تر طی شود.",
  openGraph: {
    title: "اسکیتی‌شو | دستیار تمرین اسکیت",
    description:
      "اولین اپلیکیشن ایرانی آموزش اسکیت، با آموزش گام‌به‌گام و پشتیبانی تخصصی داخل برنامه.",
    type: "website",
    locale: "fa_IR",
  },
};

/**
 * The landing is public, so a database hiccup must not take it down: each read
 * degrades to an empty list and the matching section hides itself rather than
 * throwing a 500 at an anonymous visitor. The failure is still logged.
 */
async function safeRead<T>(
  label: string,
  run: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await run();
  } catch (error) {
    console.error(`[landing] failed to load ${label}:`, error);
    return fallback;
  }
}

export default async function LandingPage() {
  // A logged-in visitor belongs in the app, not on the marketing page. This
  // verifies the JWT rather than only checking that the cookie exists, so a
  // stale or tampered cookie leaves the visitor on the landing instead of
  // bouncing them to /app and straight back out through the proxy.
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  const [coaches, faqCategories, socialLinks] = await Promise.all([
    safeRead<LandingCoach[]>(
      "coaches",
      async () => {
        const rows = await db.coach.findMany({
          select: {
            id: true,
            name: true,
            bio: true,
            avatar: true,
            specialty: true,
          },
          orderBy: { name: "asc" },
        });
        // Coach avatars are public marketing content served from the CDN.
        return rows.map((c) => ({ ...c, avatar: cdnUrl(c.avatar) || null }));
      },
      []
    ),
    safeRead<LandingFaqCategory[]>(
      "faq",
      () =>
        db.faqCategory.findMany({
          select: {
            id: true,
            title: true,
            items: {
              select: { id: true, question: true, answer: true },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        }),
      []
    ),
    safeRead(
      "social links",
      () =>
        db.socialLink.findMany({
          where: { isActive: true },
          select: { id: true, platform: true, url: true },
          orderBy: { order: "asc" },
        }),
      [] as { id: string; platform: string; url: string }[]
    ),
  ]);

  return (
    <>
      <LandingHeader />

      <main id="main">
        <Hero />
        <Features />
        <TrainingStyles />
        <CoachesSection coaches={coaches} />
        <StorySection />
        <About />
        <Referral />
        <Endorsement />
        <FaqSection categories={faqCategories} />
        <FinalCta />
      </main>

      <LandingFooter socialLinks={socialLinks} />
    </>
  );
}
