ALTER TABLE "tickets" ADD COLUMN "lessonId" TEXT;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ticket_messages" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ticket_messages" ADD COLUMN "readAt" TIMESTAMP(3);
