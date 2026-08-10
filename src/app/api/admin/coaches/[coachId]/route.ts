import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";
import { toPersianDigits } from "@/lib/utils";

function requiredText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function optionalText(value: unknown): string | null {
  const text = typeof value === "string" ? value.trim() : "";
  return text || null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { coachId } = await params;
  const body = await req.json().catch(() => null);

  const name = requiredText(body?.name);
  const specialty = requiredText(body?.specialty);

  if (!name) {
    return NextResponse.json({ error: "نام مربی الزامی است" }, { status: 400 });
  }
  if (!specialty) {
    return NextResponse.json(
      { error: "تخصص مربی الزامی است" },
      { status: 400 }
    );
  }

  const existing = await db.coach.findUnique({
    where: { id: coachId },
    select: { avatar: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "مربی یافت نشد" }, { status: 404 });
  }

  const avatar = optionalText(body?.avatar);

  const coach = await db.coach.update({
    where: { id: coachId },
    data: { name, specialty, bio: optionalText(body?.bio), avatar },
  });

  // The replaced image would otherwise sit in the bucket forever. Same cleanup
  // the banner delete does, and quiet by design: a failed cleanup must not fail
  // the edit the admin just made.
  if (existing.avatar && existing.avatar !== avatar) {
    await deleteFileQuiet("public", existing.avatar);
  }

  return NextResponse.json({ coach });
}

/**
 * Delete a coach.
 *
 * Course.coachId is REQUIRED and its relation declares no onDelete, so Prisma's
 * default (Restrict) would reject this at the database level with an opaque
 * foreign-key error. We check first and refuse with a message the admin can act
 * on, naming the number of courses in the way.
 *
 * Deleting the courses instead is not on the table — they carry chapters,
 * lessons, purchases (CourseAccess) and progress. Reassignment is a deliberate
 * choice only the admin can make, so they do it on each course's edit page and
 * then come back.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { coachId } = await params;

  const coach = await db.coach.findUnique({
    where: { id: coachId },
    select: { avatar: true, _count: { select: { courses: true } } },
  });

  if (!coach) {
    return NextResponse.json({ error: "مربی یافت نشد" }, { status: 404 });
  }

  if (coach._count.courses > 0) {
    return NextResponse.json(
      {
        error: `این مربی به ${toPersianDigits(
          coach._count.courses
        )} دوره متصل است. ابتدا مربی آن دوره‌ها را تغییر دهید یا دوره‌ها را حذف کنید.`,
        courseCount: coach._count.courses,
      },
      { status: 409 }
    );
  }

  await db.coach.delete({ where: { id: coachId } });
  await deleteFileQuiet("public", coach.avatar);

  return NextResponse.json({ ok: true });
}
