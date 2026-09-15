-- AlterTable
ALTER TABLE "banners" ADD COLUMN     "backgroundColor" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "textColor" TEXT,
ALTER COLUMN "imageKey" DROP NOT NULL;

-- Seed the discount banner that used to be hardcoded on the home page.
-- Idempotent: skipped if a banner with this title already exists.
INSERT INTO "banners" ("id", "title", "description", "link", "imageKey", "backgroundColor", "textColor", "order", "isActive", "createdAt", "updatedAt")
SELECT 'banner_discount_40_trial_7', '۴۰٪ تخفیف + ۷ روز رایگان!', 'همین الان اشتراک بگیرید', '/subscription', NULL, '#EF4444', '#FFFFFF', 0, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM "banners" WHERE "title" = '۴۰٪ تخفیف + ۷ روز رایگان!'
);
