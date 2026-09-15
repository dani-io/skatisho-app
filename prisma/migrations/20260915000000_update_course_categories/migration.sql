-- Drop SLALOM/HOCKEY, add ARTISTIC/SKATEBOARD/ROLLERBALL.
-- Postgres can't remove enum values in place, so rebuild the type.

-- AlterEnum
BEGIN;
-- Move any courses on the removed categories to GENERAL first.
UPDATE "courses" SET "category" = 'GENERAL' WHERE "category" IN ('SLALOM', 'HOCKEY');
CREATE TYPE "CourseCategory_new" AS ENUM ('GENERAL', 'SPEED', 'FREESTYLE', 'ARTISTIC', 'SKATEBOARD', 'ROLLERBALL');
ALTER TABLE "courses" ALTER COLUMN "category" TYPE "CourseCategory_new" USING ("category"::text::"CourseCategory_new");
ALTER TYPE "CourseCategory" RENAME TO "CourseCategory_old";
ALTER TYPE "CourseCategory_new" RENAME TO "CourseCategory";
DROP TYPE "CourseCategory_old";
COMMIT;
