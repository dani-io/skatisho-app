-- CreateEnum
CREATE TYPE "CouponScope" AS ENUM ('ALL', 'SUBSCRIPTION', 'SHOP');

-- AlterTable
ALTER TABLE "coupons" ADD COLUMN "scope" "CouponScope" NOT NULL DEFAULT 'ALL';
