import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Shared primitives for the landing page.
 *
 * Type hierarchy note: IRANSansX ships only Regular (400) and Bold (700), so
 * nothing here uses font-medium/semibold — hierarchy comes from size, colour and
 * those two weights only.
 */

/** Full-bleed section with a centred inner column. */
export function Section({
  id,
  className,
  innerClassName,
  children,
}: {
  id?: string;
  className?: string;
  innerClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className={cn("scroll-mt-20 px-5 py-16 md:py-24", className)}>
      <div className={cn("mx-auto w-full max-w-[1100px]", innerClassName)}>
        {children}
      </div>
    </section>
  );
}

/** Small label above a heading. Bold + tracked, never a mid weight. */
export function Eyebrow({
  children,
  tone = "dark",
}: {
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  return (
    <p
      className={cn(
        "mb-3 text-sm font-bold tracking-[0.2em]",
        tone === "dark" ? "text-primary-dark" : "text-primary"
      )}
    >
      {children}
    </p>
  );
}

/** Section heading with the yellow anchor bar that runs through the page. */
export function SectionHeading({
  title,
  subtitle,
  tone = "dark",
  as: Tag = "h2",
}: {
  title: string;
  subtitle?: string;
  tone?: "dark" | "light";
  as?: "h2" | "h3";
}) {
  return (
    <div className="mb-10 md:mb-14">
      <Tag
        className={cn(
          "text-3xl leading-tight font-bold md:text-4xl",
          tone === "dark" ? "text-on-surface" : "text-white"
        )}
      >
        {title}
      </Tag>
      <div className="mt-4 h-1 w-16 rounded-full bg-primary" aria-hidden="true" />
      {subtitle && (
        <p
          className={cn(
            "mt-5 max-w-2xl text-base leading-loose md:text-lg",
            tone === "dark" ? "text-on-surface-muted" : "text-white/70"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

const ctaBase =
  "inline-flex items-center justify-center rounded-[var(--radius-button)] px-8 py-4 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

/** Primary call to action. Anonymous visitors start at /login. */
export function CtaLink({
  href,
  children,
  variant = "primary",
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "onDark" | "quiet";
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        ctaBase,
        variant === "primary" &&
          "bg-primary text-on-surface hover:bg-primary-dark",
        variant === "onDark" &&
          "bg-primary text-on-surface hover:bg-primary-light",
        variant === "quiet" &&
          "border-2 border-on-surface/15 text-on-surface hover:border-primary hover:text-primary-dark",
        className
      )}
    >
      {children}
    </Link>
  );
}
