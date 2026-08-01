import { Readable, Transform } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadStream, deleteFileQuiet } from "@/lib/s3";
import { userAvatarUrl } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

class PayloadTooLargeError extends Error {}

function byteLimiter(limit: number) {
  let total = 0;
  let exceeded = false;

  const stream = new Transform({
    transform(chunk, _enc, cb) {
      total += chunk.length;
      if (total > limit) {
        exceeded = true;
        cb(new PayloadTooLargeError());
        return;
      }
      cb(null, chunk);
    },
  });

  return { stream, exceeded: () => exceeded };
}

/**
 * Avatar upload. The image goes to the PRIVATE bucket and is readable only
 * through /api/users/[userId]/avatar (owner or admin).
 *
 * Raw body, streamed to storage — same contract as /api/upload.
 */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const contentType = (req.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  const ext = ALLOWED[contentType];
  if (!ext) {
    return NextResponse.json(
      { error: "فرمت مجاز: JPG, PNG, WebP" },
      { status: 400 }
    );
  }

  const tooLarge = () =>
    NextResponse.json({ error: "حداکثر حجم ۵ مگابایت" }, { status: 413 });

  if (Number(req.headers.get("content-length") || 0) > MAX_SIZE) {
    return tooLarge();
  }

  if (!req.body) {
    return NextResponse.json({ error: "فایلی انتخاب نشده" }, { status: 400 });
  }

  const previous = await db.user.findUnique({
    where: { id: session.userId },
    select: { avatar: true },
  });

  const key = `avatars/${session.userId}-${Date.now()}.${ext}`;

  const source = Readable.fromWeb(req.body as never);
  const limiter = byteLimiter(MAX_SIZE);
  source.pipe(limiter.stream);

  try {
    await uploadStream("private", key, limiter.stream, contentType);
  } catch (err) {
    source.destroy();
    if (limiter.exceeded() || err instanceof PayloadTooLargeError) {
      return tooLarge();
    }
    console.error("[avatar] upload failed", err);
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }

  await db.user.update({
    where: { id: session.userId },
    data: { avatar: key },
  });

  // Drop the replaced object so avatars don't accumulate.
  if (previous?.avatar && previous.avatar !== key) {
    await deleteFileQuiet("private", previous.avatar);
  }

  return NextResponse.json({ avatar: userAvatarUrl(session.userId, key) });
}
