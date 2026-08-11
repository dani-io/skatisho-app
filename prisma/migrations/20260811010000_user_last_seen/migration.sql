-- Presence tracking for the admin user list.
--
-- NOT APPLIED — run it on deploy with `prisma migrate deploy`, per the manual
-- migration process.
--
-- Both statements are additive and backwards compatible. Existing rows get
-- lastSeenAt = NULL, which the UI renders as "هرگز" (never seen) rather than
-- as offline-with-a-date, so nothing has to be backfilled.
--
-- lastSeenAt is written by touchLastSeen in src/lib/presence.ts at most once
-- per ~2 minutes per user, via updateMany so the row's `updatedAt` (meaning
-- "profile last modified") is not disturbed.

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastSeenAt" TIMESTAMP(3);

-- CreateIndex
-- The first index on this table. The admin list orders by presence and the
-- online filter is a range scan on this column.
CREATE INDEX "users_lastSeenAt_idx" ON "users"("lastSeenAt");
