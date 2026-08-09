import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/access";

/**
 * Backs the client-side guard in src/app/admin/layout.tsx. It deliberately
 * shares requireAdmin with the admin APIs: when this route and the data routes
 * disagreed about what "admin" meant, the panel could render for someone every
 * one of its API calls would reject.
 */
export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  return NextResponse.json({ admin: true });
}
