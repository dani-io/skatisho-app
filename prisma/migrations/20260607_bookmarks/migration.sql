CREATE TABLE "lesson_bookmarks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "lesson_bookmarks_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "lesson_bookmarks_userId_lessonId_key" ON "lesson_bookmarks"("userId", "lessonId");
ALTER TABLE "lesson_bookmarks" ADD CONSTRAINT "lesson_bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lesson_bookmarks" ADD CONSTRAINT "lesson_bookmarks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
