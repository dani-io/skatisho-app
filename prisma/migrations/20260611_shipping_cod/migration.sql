ALTER TABLE "shipping_methods" ADD COLUMN "paymentType" TEXT NOT NULL DEFAULT 'PREPAID';

-- Add COD methods
INSERT INTO "shipping_methods" ("id", "title", "price", "description", "paymentType", "order") VALUES
  ('ship-tipax', 'تیپاکس (پس‌کرایه)', 0, '۲ تا ۳ روز کاری — پرداخت در مقصد', 'COD', 3),
  ('ship-air', 'ارسال هوایی (پس‌کرایه)', 0, '۱ تا ۲ روز — پرداخت در مقصد', 'COD', 4);
