import { NextResponse } from "next/server";
import { getAdminAccessSummary, requireAdmin } from "@/lib/access";

/**
 * Backs the client-side guard in src/app/admin/layout.tsx, and tells the sidebar
 * which sections to render.
 *
 * RENDERING ONLY. The permission list returned here decides what the panel
 * DRAWS, never what it may DO — every admin route runs its own server-side
 * requirePermission/requireSuperAdmin check. Hiding a nav item is a courtesy to
 * the admin, not a security boundary: typing the URL still loads the page, and
 * what stops it is the 403 from the route behind it.
 */
export async function GET() {
  // Keeps the 401-vs-403 distinction the layout guard has always returned.
  const denied = await requireAdmin();
  if (denied) return denied;

  const access = await getAdminAccessSummary();
  if (!access) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    admin: true,
    role: access.role,
    // True for super-admins AND for legacy ADMIN_PHONES holders, who have no
    // permission rows but full access this phase. Both see the whole sidebar.
    superAdmin: access.superAdmin,
    permissions: access.permissions,
  });
}
