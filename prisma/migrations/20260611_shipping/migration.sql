CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "description" TEXT,
    "minFreeAmount" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- Seed default methods
INSERT INTO "shipping_methods" ("id", "title", "price", "description", "order") VALUES
  ('ship-post', 'پست پیشتاز', 150000, '۳ تا ۵ روز کاری', 1),
  ('ship-express', 'ارسال اکسپرس', 350000, '۱ تا ۲ روز کاری', 2);
