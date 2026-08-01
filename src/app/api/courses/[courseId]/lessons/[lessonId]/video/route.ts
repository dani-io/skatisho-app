import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { canAccessLesson } from "@/lib/access";
import { getObjectStream, RangeNotSatisfiableError } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a lesson video from the PRIVATE bucket.
 *
 * This is the only way video bytes leave the server. Access is re-checked on
 * every request — including every seek — so a leaked URL is worth nothing once
 * access lapses.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; lessonId: string }> }
) {
  const { courseId, lessonId } = await params;
  const session = await getSession();

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      videoUrl: true,
      isFree: true,
      chapter: { select: { courseId: true } },
    },
  });

  // Unknown lesson, or a lesson that does not belong to the course in the path.
  // 404 for both: a 403 here would confirm the lesson exists.
  if (!lesson || lesson.chapter.courseId !== courseId) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  // Access is always evaluated against the lesson's real course.
  const allowed = await canAccessLesson(session?.userId ?? null, {
    isFree: lesson.isFree,
    courseId: lesson.chapter.courseId,
  });

  if (!allowed) {
    return session
      ? NextResponse.json(
          { error: "برای مشاهده این درس، اشتراک VIP یا خرید دوره نیاز دارید" },
          { status: 403 }
        )
      : NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const key = lesson.videoUrl;

  // A legacy absolute URL here would mean the object is not in the private
  // bucket and this route cannot protect it. Fail loudly rather than redirect.
  if (!key || /^https?:\/\//i.test(key)) {
    console.error(
      `[video] lesson ${lessonId} has a non-key videoUrl (${key || "empty"}); ` +
        `private video must be stored as a bucket key`
    );
    return NextResponse.json({ error: "منبع ویدیو نامعتبر است" }, { status: 500 });
  }

  const range = req.headers.get("range");

  let object;
  try {
    object = await getObjectStream("private", key, range);
  } catch (err) {
    if (err instanceof RangeNotSatisfiableError) {
      return new NextResponse(null, {
        status: 416,
        headers: {
          "Content-Range": `bytes */${err.size}`,
          "Accept-Ranges": "bytes",
        },
      });
    }
    throw err;
  }

  if (!object) {
    return NextResponse.json({ error: "فایل ویدیو یافت نشد" }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": object.contentType,
    "Content-Length": String(object.contentLength),
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    // Never let a shared cache hold private video.
    "Cache-Control": "private, no-store",
  });

  if (object.contentRange) {
    headers.set("Content-Range", object.contentRange);
  }

  // Node stream -> web stream. The body is piped through; it is never buffered.
  const body = Readable.toWeb(object.stream) as unknown as ReadableStream;

  return new NextResponse(body, {
    status: object.partial ? 206 : 200,
    headers,
  });
}
