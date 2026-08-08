import { Section, SectionHeading } from "./ui";

export type LandingCoach = {
  id: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  specialty: string | null;
};

/**
 * Coaches come from the `Coach` table (same rows the admin panel edits) — the
 * list is never hardcoded here. `specialty` is rendered exactly as stored; the
 * seeded values already match the confirmed mapping (امیررضا = اسکیت سرعت،
 * مجتبی و کیمیا = آموزش عمومی), so no display-side correction is applied. If a
 * specialty ever looks wrong on the page, fix the row in the admin panel.
 */
export function CoachesSection({ coaches }: { coaches: LandingCoach[] }) {
  if (coaches.length === 0) return null;

  return (
    <Section id="coaches">
      <SectionHeading
        title="مربیان آموزش‌دهنده‌ی اسکیتی‌شو"
        subtitle="مربیان ما، راهنمای مسیر شما — با تجربه و مهارت در آموزش اسکیت کنار شما هستند."
      />

      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.map((coach) => (
          <li
            key={coach.id}
            className="flex flex-col rounded-[var(--radius-card)] bg-surface-dim p-6 md:p-7"
          >
            <div className="flex items-center gap-4">
              {coach.avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={coach.avatar}
                  alt={`عکس ${coach.name}`}
                  width={64}
                  height={64}
                  loading="lazy"
                  className="h-16 w-16 shrink-0 rounded-full object-cover"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-surface"
                >
                  {coach.name.trim().charAt(0)}
                </div>
              )}

              <div className="min-w-0">
                <h3 className="text-lg font-bold">{coach.name}</h3>
                {coach.specialty && (
                  <span className="mt-1 inline-block rounded-full bg-primary px-3 py-1 text-xs font-bold text-on-surface">
                    {coach.specialty}
                  </span>
                )}
              </div>
            </div>

            {coach.bio && (
              <p className="mt-5 text-sm leading-loose text-on-surface-muted">
                {coach.bio}
              </p>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
