import { db } from "@/lib/db";

type NotifType = "GENERAL" | "TICKET_REPLY" | "ORDER_UPDATE" | "SUBSCRIPTION" | "SYSTEM";

export async function createNotification({
  userId,
  title,
  message,
  type = "GENERAL",
  link,
}: {
  userId: string;
  title: string;
  message: string;
  type?: NotifType;
  link?: string;
}) {
  return db.notification.create({
    data: { userId, title, message, type, link },
  });
}
