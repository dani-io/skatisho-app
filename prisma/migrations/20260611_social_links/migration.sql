CREATE TABLE "social_links" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "social_links_pkey" PRIMARY KEY ("id")
);

INSERT INTO "social_links" ("id", "platform", "url", "order") VALUES
  ('sl-ig', 'instagram', 'https://instagram.com/skatisho', 1),
  ('sl-tg', 'telegram', 'https://t.me/skatisho', 2),
  ('sl-li', 'linkedin', 'https://linkedin.com/company/skatisho', 3);
