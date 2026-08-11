import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { getObjectStream } from "@/lib/s3";

export const runtime = "nodejs";

/**
 * Public media: streams an object out of the PUBLIC bucket.
 *
 * MinIO sits on the internal network with no anonymous read policy, and the
 * `cdn.skatisho.com` host these URLs used to point at never existed. Rather than
 * publishing the storage box, the app — which is already internet-reachable and
 * can already reach MinIO — hands the bytes over itself. Same shape as the
 * avatar and video routes, minus the auth: this content is public by definition
 * (coach photos, course covers, product shots, banners) and the landing page
 * renders it for logged-out visitors.
 *
 * Deliberately NOT under /api: proxy answers unauthenticated /api/* with 401
 * JSON, which is wrong for an <img> tag. "/media/" is listed in the proxy's
 * PUBLIC_PATHS so this is public by design rather than by accident of the
 * dot-in-path static bypass.
 */

/**
 * THE containment boundary: the bucket is this literal, never anything derived
 * from the request. A crafted key cannot select a bucket, so private videos and
 * private avatars are unreachable through this route no matter what is asked
 * for — the worst a hostile key achieves is a 404 inside the public bucket.
 */
const BUCKET = "public" as const;

/**
 * Mirrors what /api/upload is capable of producing (`folder/<ts>-<rand>.<ext>`,
 * folders sanitised to [a-zA-Z0-9/_-]), as an allowlist rather than a denylist.
 *
 * Next has already percent-decoded these segments, so `%2e%2e` arrives as ".."
 * and `%2f` as "/" — both rejected below. An allowlist means a decoding trick
 * nobody thought of still has to survive this pattern to get anywhere.
 */
const SEGMENT = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;

/** Longer than any key this app mints; a cheap ceiling on pathological input. */
const MAX_KEY_LENGTH = 512;

function resolveKey(segments: string[] | undefined): string | null {
  if (!segments || segments.length === 0) return null;

  for (const segment of segments) {
    // "." and ".." are the traversal cases; the pattern also rejects a leading
    // dot, an embedded slash or backslash, and NUL.
    if (segment === "." || segment === "..") return null;
    if (!SEGMENT.test(segment)) return null;
  }

  const key = segments.join("/");
  return key.length <= MAX_KEY_LENGTH ? key : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: segments } = await params;
  const key = resolveKey(segments);

  // A rejected key is indistinguishable from a missing one on purpose: this
  // route should not tell a prober which of their attempts was well-formed.
  if (!key) return new NextResponse(null, { status: 404 });

  let object;
  try {
    object = await getObjectStream(BUCKET, key);
  } catch (err) {
    // Storage being unreachable is a server problem, not a missing image, and
    // must not be reported as 404 — that would get cached as a permanent gap.
    console.error(`[media] failed to read ${BUCKET}/${key}`, err);
    return new NextResponse(null, { status: 500 });
  }

  if (!object) return new NextResponse(null, { status: 404 });

  const headers = new Headers({
    "Content-Type": object.contentType,
    "Content-Length": String(object.contentLength),
    // Keys are `<timestamp>-<random>.<ext>` and are never overwritten — a new
    // upload always mints a new key — so the bytes behind a URL genuinely
    // cannot change. That is what makes `immutable` honest here, and it lets
    // the Cloudflare edge absorb essentially all of this traffic.
    "Cache-Control": "public, max-age=31536000, immutable",
    "Content-Disposition": "inline",
    // Uploads are restricted to jpeg/png/webp, and the stored Content-Type is
    // what we echo; nosniff stops a browser second-guessing that.
    "X-Content-Type-Options": "nosniff",
  });

  if (object.etag) headers.set("ETag", object.etag);

  const body = Readable.toWeb(object.stream) as unknown as ReadableStream;

  return new NextResponse(body, { status: 200, headers });
}
