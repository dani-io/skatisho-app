-- Phase 1 of permission-based admin access.
--
-- Generated with `prisma migrate diff` against a shadow database, so this is
-- exactly what Prisma would have written. NOT APPLIED — run it on deploy with
-- `prisma migrate deploy`, per the manual-migration process.
--
-- Both statements are additive and backwards compatible: no existing row
-- changes, and code that only knows USER/ADMIN keeps working unchanged.
--
-- Requires PostgreSQL 12+. Older versions cannot run ALTER TYPE ... ADD VALUE
-- inside a transaction block, and Prisma wraps each migration in one. Nothing
-- here USES the new enum value, which is the other PG restriction on adding
-- one; the first SUPER_ADMIN row is written later, at login time, by
-- applySuperAdminFloor in src/lib/access.ts.

-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];
