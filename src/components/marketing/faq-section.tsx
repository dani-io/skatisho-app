import { Section, SectionHeading } from "./ui";

export type LandingFaqCategory = {
  id: string;
  title: string;
  items: { id: string; question: string; answer: string }[];
};

/**
 * FAQ content comes from the `FaqCategory` / `FaqItem` tables — the same rows
 * the admin panel manages. Nothing here is hardcoded except the closing note.
 *
 * Built on native <details>/<summary> rather than a JS accordion: it is
 * keyboard-operable and screen-reader-friendly for free, and it still expands
 * if JS fails to load — which matters on a public marketing page.
 */
export function FaqSection({ categories }: { categories: LandingFaqCategory[] }) {
  const populated = categories.filter((c) => c.items.length > 0);
  if (populated.length === 0) return null;

  return (
    <Section id="faq" className="bg-surface-dim">
      <SectionHeading title="سوالات متداول" />

      <div className="space-y-10">
        {populated.map((category) => (
          <div key={category.id}>
            <h3 className="mb-4 text-sm font-bold tracking-[0.2em] text-primary-dark">
              {category.title}
            </h3>

            <div className="space-y-3">
              {category.items.map((item) => (
                <details
                  key={item.id}
                  className="group rounded-[var(--radius-card)] bg-surface px-5 open:pb-1 md:px-6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-start text-base font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                    <span>{item.question}</span>
                    <svg
                      className="h-5 w-5 shrink-0 text-primary-dark transition-transform group-open:rotate-180 motion-reduce:transition-none"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="pb-5 text-sm leading-loose whitespace-pre-line text-on-surface-muted">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-10 text-sm leading-loose text-on-surface-muted">
        هنوز جواب سوالت رو پیدا نکردی؟ از طریق پشتیبانی داخل اپلیکیشن با تیم
        اسکیتی‌شو در تماس باش.
      </p>
    </Section>
  );
}
