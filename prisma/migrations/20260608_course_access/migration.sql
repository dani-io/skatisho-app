ALTER TABLE "courses" ADD COLUMN "price" INTEGER;

CREATE TABLE "course_access" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_access_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "course_access_userId_courseId_key" ON "course_access"("userId", "courseId");
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_access" ADD CONSTRAINT "course_access_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
