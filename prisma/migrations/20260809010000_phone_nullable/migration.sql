-- AlterTable
-- A Google-only admin (created via the admin allowlist) has no phone number.
-- The UNIQUE index on "phone" is unaffected: Postgres permits multiple NULLs
-- under a unique index, so real phone numbers stay unique.
ALTER TABLE "users" ALTER COLUMN "phone" DROP NOT NULL;
