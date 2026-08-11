import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getLiveSession } from "@/lib/presence";
import { canAccessAvatar } from "@/lib/access";
import { getObjectStream, RangeNotSatisfiableError } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Streams a user avatar from the PRIVATE bucket. Owner or admin only.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const session = await getLiveSession();

  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  if (!(await canAccessAvatar(session.userId, userId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  if (!user?.avatar) {
    return NextResponse.json({ error: "آواتاری یافت نشد" }, { status: 404 });
  }

  if (/^https?:\/\//i.test(user.avatar)) {
    console.error(
      `[avatar] user ${userId} has a non-key avatar (${user.avatar}); ` +
        `private avatars must be stored as a bucket key`
    );
    return NextResponse.json({ error: "منبع تصویر نامعتبر است" }, { status: 500 });
  }

  const range = req.headers.get("range");

  let object;
  try {
    object = await getObjectStream("private", user.avatar, range);
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
    return NextResponse.json({ error: "آواتاری یافت نشد" }, { status: 404 });
  }

  const headers = new Headers({
    "Content-Type": object.contentType,
    "Content-Length": String(object.contentLength),
    "Accept-Ranges": "bytes",
    "Content-Disposition": "inline",
    // Per-user content: a browser may keep it, shared caches may not.
    "Cache-Control": "private, max-age=300",
  });

  if (object.contentRange) {
    headers.set("Content-Range", object.contentRange);
  }

  const body = Readable.toWeb(object.stream) as unknown as ReadableStream;

  return new NextResponse(body, {
    status: object.partial ? 206 : 200,
    headers,
  });
}
