/**
 * URL builders.
 *
 * PUBLIC files (course/lesson thumbnails, product images, banners, coach
 * avatars) live in the public bucket and are served straight from the CDN.
 *
 * PRIVATE files (course videos, user avatars) are NEVER given a storage URL.
 * They are reachable only through authenticated app routes, which check access
 * per request and stream the bytes. The builders below return those route
 * paths, not storage locations.
 */

const CDN_BASE = (
  process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.skatisho.com"
).replace(/\/+$/, "");

/**
 * Public CDN URL for a stored key. Keeps a passthrough for legacy rows that
 * already hold an absolute URL — harmless here, since nothing behind this
 * builder is access-controlled.
 */
export function cdnUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  return `${CDN_BASE}/${key.replace(/^\/+/, "")}`;
}

/** Protected route that streams a lesson's video after checking access. */
export function lessonVideoUrl(courseId: string, lessonId: string): string {
  return `/api/courses/${courseId}/lessons/${lessonId}/video`;
}

/**
 * Protected route that streams a user's avatar after checking access.
 *
 * Passing the stored key appends a cache-buster, so a re-upload is picked up
 * even though the route sets a private browser cache.
 */
export function userAvatarUrl(
  userId: string,
  avatarKey?: string | null
): string {
  const base = `/api/users/${userId}/avatar`;
  if (!avatarKey) return base;
  const version = avatarKey.replace(/[^a-zA-Z0-9]/g, "").slice(-10);
  return `${base}?v=${version}`;
}
