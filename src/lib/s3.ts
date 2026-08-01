import { Readable } from "node:stream";
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { requireEnv } from "@/lib/env";

/**
 * MinIO lives on the internal Docker network only. The browser never talks to
 * it: public objects reach users via the CDN, private objects only through
 * authenticated app routes that stream the bytes.
 */

export type BucketKind = "private" | "public";

// requireEnv lives in lib/env — a silent fallback to a LAN box is how private
// video ends up on a public endpoint.

let client: S3Client | null = null;

// Lazy so a missing env var fails on first use at runtime, not at build time.
function s3(): S3Client {
  if (client) return client;
  client = new S3Client({
    endpoint: requireEnv("S3_ENDPOINT"),
    region: process.env.S3_REGION || "us-east-1",
    credentials: {
      accessKeyId: requireEnv("S3_ACCESS_KEY"),
      secretAccessKey: requireEnv("S3_SECRET_KEY"),
    },
    forcePathStyle: true,
  });
  return client;
}

export function bucketName(kind: BucketKind): string {
  return kind === "private"
    ? requireEnv("S3_BUCKET_PRIVATE")
    : requireEnv("S3_BUCKET_PUBLIC");
}

/**
 * Streams a body into storage using multipart upload.
 *
 * Memory stays flat regardless of object size: lib-storage buffers at most
 * `partSize * queueSize` (here 5MB * 2 = 10MB) at a time and uploads parts as
 * they fill. Nothing ever holds the whole file.
 */
export async function uploadStream(
  kind: BucketKind,
  key: string,
  body: Readable,
  contentType: string
): Promise<string> {
  const upload = new Upload({
    client: s3(),
    params: {
      Bucket: bucketName(kind),
      Key: key,
      Body: body,
      ContentType: contentType,
    },
    partSize: 5 * 1024 * 1024,
    queueSize: 2,
  });

  await upload.done();
  return key;
}

export interface ObjectStream {
  stream: Readable;
  contentType: string;
  /** Length of the returned slice (not necessarily the whole object). */
  contentLength: number;
  /** Present only for a satisfied range request, e.g. "bytes 0-1023/5242880". */
  contentRange?: string;
  /** True when the response is a partial (206) body. */
  partial: boolean;
}

export class RangeNotSatisfiableError extends Error {
  constructor(public size: number) {
    super("range not satisfiable");
  }
}

/**
 * Fetches an object, optionally a byte range. The `range` argument is the raw
 * HTTP Range header — S3/MinIO parses and validates it, so we never have to
 * hand-roll range arithmetic.
 */
export async function getObjectStream(
  kind: BucketKind,
  key: string,
  range?: string | null
): Promise<ObjectStream | null> {
  try {
    const res = await s3().send(
      new GetObjectCommand({
        Bucket: bucketName(kind),
        Key: key,
        Range: range || undefined,
      })
    );

    if (!res.Body) return null;

    return {
      stream: res.Body as Readable,
      contentType: res.ContentType || "application/octet-stream",
      contentLength: res.ContentLength ?? 0,
      contentRange: res.ContentRange,
      partial: !!res.ContentRange,
    };
  } catch (err: unknown) {
    const name = (err as { name?: string })?.name;

    if (name === "NoSuchKey" || name === "NotFound") return null;

    if (name === "InvalidRange") {
      const size = await objectSize(kind, key);
      throw new RangeNotSatisfiableError(size ?? 0);
    }

    throw err;
  }
}

export async function objectSize(
  kind: BucketKind,
  key: string
): Promise<number | null> {
  try {
    const res = await s3().send(
      new HeadObjectCommand({ Bucket: bucketName(kind), Key: key })
    );
    return res.ContentLength ?? null;
  } catch {
    return null;
  }
}

export async function deleteFile(kind: BucketKind, key: string): Promise<void> {
  await s3().send(
    new DeleteObjectCommand({ Bucket: bucketName(kind), Key: key })
  );
}

/**
 * Best-effort delete for cleanup paths. Storage problems must not fail the
 * database operation that triggered them.
 */
export async function deleteFileQuiet(
  kind: BucketKind,
  key: string | null | undefined
): Promise<void> {
  if (!key || key.startsWith("http")) return;
  try {
    await deleteFile(kind, key);
  } catch (err) {
    console.error(`[storage] failed to delete ${kind}/${key}`, err);
  }
}
