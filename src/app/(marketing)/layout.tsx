/**
 * Layout for the public marketing landing.
 *
 * Deliberately minimal: no BottomNav (it polls /api/tickets on an interval and
 * would 401-loop for an anonymous visitor), no CartSync, no InstallPrompt, and
 * no `max-w-lg` cap — unlike the (main) app shell this is full-bleed and each
 * section sets its own inner max-width. RTL, IRANSansX and the theme tokens are
 * inherited from the root layout.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-full bg-surface text-on-surface overflow-x-hidden">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-[100] focus:rounded-[var(--radius-button)] focus:bg-primary focus:px-5 focus:py-3 focus:text-sm focus:font-bold focus:text-on-surface"
      >
        رفتن به محتوای اصلی
      </a>
      {children}
    </div>
  );
}
