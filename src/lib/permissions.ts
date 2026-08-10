/**
 * The grantable admin sections.
 *
 * THE list: the permission-checkbox UI renders from it and the PATCH endpoint
 * validates against it, so a key can never be granted that no route recognises.
 * Each `key` must match the string passed to requirePermission() in that
 * section's route handlers exactly.
 *
 * "admins" is deliberately absent. Admin management is reserved for
 * SUPER_ADMIN via requireSuperAdmin() and is not delegable — putting it here
 * would let a super-admin hand out the power to create super-admins.
 *
 * The sidebar in src/app/admin/layout.tsx carries the same keys alongside its
 * icons and hrefs. Adding a section means touching both.
 */
export interface AdminSection {
  key: string;
  label: string;
}

export const ADMIN_SECTIONS: AdminSection[] = [
  { key: "dashboard", label: "داشبورد" },
  { key: "users", label: "کاربران" },
  { key: "courses", label: "دوره‌ها و ویدئوها" },
  { key: "coaches", label: "مربیان" },
  { key: "subscriptions", label: "اشتراک‌ها" },
  { key: "products", label: "فروشگاه" },
  { key: "tickets", label: "تیکت‌ها" },
  { key: "coupons", label: "کدهای تخفیف" },
  { key: "banners", label: "بنرها" },
  { key: "gift-cards", label: "کارت هدیه" },
  { key: "faq", label: "سوالات متداول" },
  { key: "shipping", label: "روش‌های ارسال" },
  { key: "social", label: "شبکه‌های اجتماعی" },
  { key: "orders", label: "سفارشات" },
  { key: "reports", label: "گزارشات" },
];

export const ADMIN_SECTION_KEYS = ADMIN_SECTIONS.map((s) => s.key);

/**
 * Normalises a submitted permission list: keeps only known keys, de-duplicates,
 * and returns them in ADMIN_SECTIONS order so stored arrays are comparable.
 * Returns null when the input contains anything unknown — the caller rejects
 * rather than silently dropping, so a typo surfaces instead of quietly
 * granting less than intended.
 */
export function normalizePermissions(input: unknown): string[] | null {
  if (!Array.isArray(input)) return null;
  if (!input.every((k) => typeof k === "string")) return null;

  const submitted = new Set(input as string[]);
  for (const key of submitted) {
    if (!ADMIN_SECTION_KEYS.includes(key)) return null;
  }
  return ADMIN_SECTION_KEYS.filter((key) => submitted.has(key));
}
