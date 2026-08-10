import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";

/**
 * Admin CRUD for coaches. The public read path is /api/coaches — this one is
 * gated and additionally reports how many courses each coach owns, which is
 * what the delete guard in [coachId] keys off.
 *
 * `avatar` holds the raw storage key in the PUBLIC bucket (same convention as
 * Banner.imageKey and Product images). It is turned into a URL with cdnUrl at
 * render time, never stored as an absolute URL.
 */

export async function GET() {
  const denied = await requirePermission("coaches");
  if (denied) return denied;

  const coaches = await db.coach.findMany({
    include: { _count: { select: { courses: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ coaches });
}

/** Trims and collapses a required text field; returns "" when unusable. */
function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/** Optional text: empty string becomes null so the column stays clean. */
function optionalText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export async function POST(req: NextRequest) {
  const denied = await requirePermission("coaches");
  if (denied) return denied;

  const body = await req.json().catch(() => null);

  const name = requiredText(body?.name);
  const specialty = requiredText(body?.specialty);

  if (!name) {
    return NextResponse.json({ error: "نام مربی الزامی است" }, { status: 400 });
  }
  // specialty is nullable in the schema (older rows predate this form), but the
  // landing renders it as the coach's badge, so new rows must carry one.
  if (!specialty) {
    return NextResponse.json(
      { error: "تخصص مربی الزامی است" },
      { status: 400 }
    );
  }

  const coach = await db.coach.create({
    data: {
      name,
      specialty,
      bio: optionalText(body?.bio),
      avatar: optionalText(body?.avatar),
    },
  });

  return NextResponse.json({ coach }, { status: 201 });
}
