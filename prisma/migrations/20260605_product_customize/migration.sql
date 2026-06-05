ALTER TABLE "products" ADD COLUMN "customizable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "products" ADD COLUMN "options" JSONB;
ALTER TABLE "order_items" ADD COLUMN "selectedOptions" JSONB;
