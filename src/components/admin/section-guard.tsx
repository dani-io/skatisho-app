import { ShieldAlert } from "lucide-react";
import { hasPermission, hasSuperAdmin } from "@/lib/access";

/**
 * Server-side gate for one admin section, used as a nested layout so the whole
 * section is covered by a single file per directory.
 *
 * This exists for HONESTY, not for security: without it, an admin who types a
 * forbidden URL gets the section's full shell — headings, toolbars, an empty
 * table — because the pages are client components whose data simply 403s. No
 * data leaks either way; the difference is whether the panel says "you don't
 * have access" or silently looks broken.
 *
 * The real boundary is the requirePermission / requireSuperAdmin call in each
 * route handler. If this component were deleted tomorrow, nothing would leak.
 */
export async function AdminSectionGuard({
  permission,
  superAdminOnly,
  children,
}: {
  permission?: string;
  superAdminOnly?: boolean;
  children: React.ReactNode;
}) {
  const allowed = superAdminOnly
    ? await hasSuperAdmin()
    : await hasPermission(permission!);

  if (allowed) return <>{children}</>;

  // Deliberately not a redirect: an admin with no dashboard permission would
  // bounce straight back here and loop.
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <ShieldAlert className="w-12 h-12 mb-4 text-on-surface-muted opacity-30" />
      <p className="text-sm font-bold">به این بخش دسترسی ندارید</p>
      <p className="text-xs text-on-surface-muted mt-1">
        برای دریافت دسترسی با مدیر ارشد تماس بگیرید.
      </p>
    </div>
  );
}
