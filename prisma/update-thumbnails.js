const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function main() {
  await db.course.update({
    where: { id: "course-general" },
    data: { thumbnail: "/images/course-general.svg" },
  });

  await db.course.update({
    where: { id: "course-speed" },
    data: { thumbnail: "/images/course-speed.svg" },
  });

  console.log("✅ Thumbnails updated!");
}

main().catch(console.error).finally(() => db.$disconnect());
