import { Readable, Transform } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/access";
import { uploadStream, type BucketKind } from "@/lib/s3";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500MB

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
};

class PayloadTooLargeError extends Error {}

/**
 * Passes bytes through while enforcing a hard ceiling. Content-Length is a
 * hint from the client; this is the actual limit.
 *
 * `exceeded` is checked in the catch block rather than relying on the upload
 * library to surface the original stream error unwrapped.
 */
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

function safeSegment(value: string): string {
  // Keys are server-built; this only keeps caller-supplied folders sane.
  return value.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/\.+/g, "");
}

/**
 * Raw-body upload.
 *
 *   POST /api/upload?folder=courses/videos&bucket=private
 *   Content-Type: video/mp4
 *   <raw bytes>
 *
 * The body is piped straight into a multipart upload to MinIO. The previous
 * implementation called req.formData(), which materialised the entire file
 * (up to 500MB) in memory before a single byte reached storage.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { searchParams } = new URL(req.url);
  const folder = safeSegment(searchParams.get("folder") || "misc") || "misc";
  const bucketParam = searchParams.get("bucket");

  // Explicit and required — never inferred from the file itself.
  if (bucketParam !== "private" && bucketParam !== "public") {
    return NextResponse.json(
      { error: "پارامتر bucket باید private یا public باشد" },
      { status: 400 }
    );
  }
  const bucket: BucketKind = bucketParam;

  const contentType = (req.headers.get("content-type") || "")
    .split(";")[0]
    .trim()
    .toLowerCase();

  const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
  const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);

  if (!isImage && !isVideo) {
    return NextResponse.json({ error: "فرمت فایل مجاز نیست" }, { status: 400 });
  }

  // Video is private content by definition; refuse to place it where the CDN
  // would serve it without auth.
  if (isVideo && bucket !== "private") {
    return NextResponse.json(
      { error: "ویدیو فقط در باکت خصوصی ذخیره می‌شود" },
      { status: 400 }
    );
  }

  const limit = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  const tooLarge = () =>
    NextResponse.json(
      {
        error: isVideo
          ? "حداکثر حجم ویدیو ۵۰۰ مگابایت"
          : "حداکثر حجم تصویر ۱۰ مگابایت",
      },
      { status: 413 }
    );

  // Cheap rejection before we stream anything.
  const declared = Number(req.headers.get("content-length") || 0);
  if (declared > limit) return tooLarge();

  if (!req.body) {
    return NextResponse.json({ error: "فایلی ارسال نشده" }, { status: 400 });
  }

  const ext = EXT_BY_TYPE[contentType] || "bin";
  const key = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`;

  const source = Readable.fromWeb(req.body as never);
  const limiter = byteLimiter(limit);
  source.pipe(limiter.stream);

  try {
    await uploadStream(bucket, key, limiter.stream, contentType);
  } catch (err) {
    source.destroy();
    if (limiter.exceeded() || err instanceof PayloadTooLargeError) {
      return tooLarge();
    }
    console.error("[upload] failed", err);
    return NextResponse.json({ error: "خطا در آپلود فایل" }, { status: 500 });
  }

  return NextResponse.json({ key, bucket });
}
