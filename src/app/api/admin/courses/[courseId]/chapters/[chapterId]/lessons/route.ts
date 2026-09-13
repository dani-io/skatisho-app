import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requirePermission } from "@/lib/access";
import { deleteFileQuiet } from "@/lib/s3";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId, chapterId } = await params;
  const body = await req.json();

  // Same ownership rule the PUT enforces: the chapter in the path must actually
  // belong to the course in the path, or the lesson would be created under a
  // chapter this URL does not own.
  const chapter = await db.chapter.findFirst({
    where: { id: chapterId, courseId },
    select: { id: true },
  });

  if (!chapter) {
    return NextResponse.json({ error: "فصل یافت نشد" }, { status: 404 });
  }

  const maxOrder = await db.lesson.aggregate({
    where: { chapterId },
    _max: { order: true },
  });

  const lesson = await db.lesson.create({
    data: {
      title: body.title,
      description: body.description || null,
      videoUrl: body.videoUrl,
      duration: body.duration || 0,
      thumbnail: body.thumbnail || null,
      isFree: body.isFree ?? false,
      chapterId,
      order: (maxOrder._max.order ?? 0) + 1,
    },
  });

  return NextResponse.json({ lesson });
}

/**
 * A replacement media key sent by the edit form. It has to be a bare storage key
 * (never an http URL) inside the folder FileUpload writes that media to. The
 * check matters beyond tidiness: whatever key is stored here is deleted from the
 * bucket the next time the lesson's media is replaced, so accepting an arbitrary
 * key would let a later edit delete an object this lesson never owned.
 */
function mediaKey(value: unknown, folder: string): string | null {
  if (typeof value !== "string") return null;
  const key = value.trim();
  if (!key.startsWith(`${folder}/`) || key.includes("..")) return null;
  return key;
}

/**
 * Edit an existing lesson, optionally replacing its video and/or thumbnail.
 *
 * videoUrl and thumbnail are only written when present in the body. Absent means
 * "keep what is stored", so a text-only save can never blank the video key.
 * When a new key replaces an old one, the old object is deleted from its bucket
 * (private for video, public for the thumbnail) so replacements do not orphan
 * files.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId, chapterId } = await params;
  const body = await req.json();

  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "عنوان درس الزامی است" }, { status: 400 });
  }

  const duration = body.duration ?? 0;
  if (!Number.isInteger(duration) || duration < 0) {
    return NextResponse.json(
      { error: "مدت درس باید عددی صحیح و نامنفی باشد" },
      { status: 400 }
    );
  }

  if (typeof body.isFree !== "boolean") {
    return NextResponse.json(
      { error: "مقدار رایگان باید بولین باشد" },
      { status: 400 }
    );
  }

  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : null;

  let videoUrl: string | undefined;
  if (body.videoUrl !== undefined) {
    videoUrl = mediaKey(body.videoUrl, "courses/videos") ?? undefined;
    if (!videoUrl) {
      return NextResponse.json({ error: "کلید ویدیو نامعتبر است" }, { status: 400 });
    }
  }

  let thumbnail: string | undefined;
  if (body.thumbnail !== undefined) {
    thumbnail = mediaKey(body.thumbnail, "courses/thumbnails") ?? undefined;
    if (!thumbnail) {
      return NextResponse.json({ error: "کلید تصویر بندانگشتی نامعتبر است" }, { status: 400 });
    }
  }

  // The lesson is addressed by id, but the id alone says nothing about who owns
  // it. Without this check any admin holding "courses" could edit a lesson in
  // any other course by posting its id to a chapter they can reach. Scoping to
  // BOTH the chapter and that chapter's course means the URL has to name the
  // real owner; anything else is a 404, same as an unknown id. The same query
  // fetches the current media keys, which a replacement has to clean up.
  const existing = await db.lesson.findFirst({
    where: { id, chapterId, chapter: { courseId } },
    select: { videoUrl: true, thumbnail: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  const videoReplaced = videoUrl !== undefined && videoUrl !== existing.videoUrl;
  const thumbnailReplaced = thumbnail !== undefined && thumbnail !== existing.thumbnail;

  const lesson = await db.lesson.update({
    where: { id },
    data: {
      title,
      description,
      duration,
      isFree: body.isFree,
      ...(videoReplaced ? { videoUrl } : {}),
      ...(thumbnailReplaced ? { thumbnail } : {}),
      // Reordering is not part of this form; only honour an explicit valid value.
      ...(Number.isInteger(body.order) && body.order >= 0
        ? { order: body.order }
        : {}),
    },
  });

  // Old objects go only after the row points at the new keys. Deleting first
  // would leave the lesson referencing a missing video if the update failed.
  if (videoReplaced) await deleteFileQuiet("private", existing.videoUrl);
  if (thumbnailReplaced) await deleteFileQuiet("public", existing.thumbnail);

  return NextResponse.json({ lesson });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string; chapterId: string }> }
) {
  const denied = await requirePermission("courses");
  if (denied) return denied;

  const { courseId, chapterId } = await params;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  // Ownership is settled BEFORE anything is destroyed, and the same query
  // fetches the keys the cleanup below needs. This is the delete path, so a
  // missed check is unrecoverable: the row goes, and the video goes with it out
  // of the private bucket. A lesson that does not belong to this chapter, in
  // this course, is a 404 and nothing is touched.
  const lesson = await db.lesson.findFirst({
    where: { id, chapterId, chapter: { courseId } },
    select: { videoUrl: true, thumbnail: true },
  });

  if (!lesson) {
    return NextResponse.json({ error: "درس یافت نشد" }, { status: 404 });
  }

  await db.lesson.delete({ where: { id } });

  // Video lives in the private bucket, its thumbnail in the public one.
  await deleteFileQuiet("private", lesson.videoUrl);
  await deleteFileQuiet("public", lesson.thumbnail);

  return NextResponse.json({ success: true });
}
