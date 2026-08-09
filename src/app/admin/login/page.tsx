/**
 * Admin sign-in. Deliberately separate from /login so regular users are never
 * shown a Google button they cannot use — OTP remains the only way in for them.
 *
 * The button is a plain link: all the work happens server-side in
 * /api/auth/google, which mints the CSRF state before redirecting to Google.
 */

const ERRORS: Record<string, string> = {
  not_admin: "این حساب Google دسترسی ادمین ندارد.",
  denied: "ورود با Google لغو شد.",
  invalid_request: "درخواست ورود معتبر نبود. دوباره تلاش کنید.",
  google_failed: "ارتباط با Google برقرار نشد. دوباره تلاش کنید.",
  unconfigured: "ورود با Google پیکربندی نشده است.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message = error ? ERRORS[error] ?? ERRORS.invalid_request : null;

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-6 bg-surface-dim"
      dir="rtl"
    >
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <img src="/icons/logo.svg" alt="" className="w-9 h-9" />
          </div>
          <h1 className="text-lg font-bold">پنل مدیریت اسکیتی‌شو</h1>
          <p className="text-xs text-on-surface-muted mt-1">
            ورود مخصوص مدیران
          </p>
        </div>

        {message && (
          <div
            role="alert"
            className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700 leading-relaxed"
          >
            {message}
          </div>
        )}

        <a
          href="/api/auth/google"
          className="flex items-center justify-center gap-3 w-full rounded-xl border border-surface-container bg-white px-4 py-3 text-sm font-bold transition-colors hover:bg-surface-dim"
        >
          <GoogleMark />
          ورود با Google
        </a>

        <p className="mt-6 text-[11px] text-on-surface-muted text-center leading-relaxed">
          فقط حساب‌هایی که توسط مدیران به فهرست دسترسی اضافه شده‌اند می‌توانند
          وارد شوند.
        </p>
      </div>

      <a
        href="/login"
        className="mt-6 text-xs text-on-surface-muted hover:underline"
      >
        ورود کاربران با شماره موبایل
      </a>
    </div>
  );
}

/** Google's four-colour "G", inlined so the page pulls in no external asset. */
function GoogleMark() {
  return (
    <svg className="w-4.5 h-4.5" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
