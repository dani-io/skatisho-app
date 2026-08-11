/**
 * URL builders.
 *
 * PUBLIC files (course/lesson thumbnails, product images, banners, coach
 * avatars) live in the public bucket and are served by app/media/[...key],
 * which streams them out of storage. They are public, but they are not served
 * BY the storage box: MinIO stays on the internal network.
 *
 * PRIVATE files (course videos, user avatars) are NEVER given a storage URL.
 * They are reachable only through authenticated app routes, which check access
 * per request and stream the bytes. The builders below return those route
 * paths, not storage locations.
 */

/**
 * Base for public media URLs. Relative on purpose: same-origin means these URLs
 * work under any domain the app is served from, which matters because
 * NEXT_PUBLIC_* is inlined at BUILD time — an absolute base bakes one hostname
 * into the bundle and needs a rebuild to change. The default is the real answer
 * rather than a placeholder, so a deploy that forgets the variable still works.
 * (The previous default, https://cdn.skatisho.com, was a host that never
 * existed: it had no DNS record, so every image failed with ERR_FAILED.)
 */
const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_URL || "/media").replace(
  /\/+$/,
  ""
);

/**
 * Public URL for a stored key.
 *
 * Two passthroughs, both for keys that are already URLs rather than keys:
 * legacy rows holding an absolute URL, and anything already prefixed with the
 * base (so a value that has been through here once does not come out as
 * /media/media/...). Neither is access-controlled, which is what makes the
 * passthrough safe — nothing behind this builder is private.
 */
export function cdnUrl(key: string | null | undefined): string {
  if (!key) return "";
  if (key.startsWith("http://") || key.startsWith("https://")) return key;
  if (CDN_BASE && key.startsWith(`${CDN_BASE}/`)) return key;
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
