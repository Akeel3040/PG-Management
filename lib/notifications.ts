import { prisma } from "./prisma";
import { NotificationType } from "@prisma/client";

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  linkUrl?: string;
}

export async function createNotification({
  userId,
  title,
  message,
  type = "GENERAL",
  linkUrl,
}: CreateNotificationParams) {
  try {
    return await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        linkUrl,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
    return null;
  }
}

export async function notifyPropertyStaff(
  propertyId: string,
  title: string,
  message: string,
  type: NotificationType = "GENERAL",
  linkUrl?: string
) {
  try {
    const staffUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: { in: ["OWNER", "SUPER_ADMIN"] } },
          { assignedPropertyId: propertyId },
        ],
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (staffUsers.length === 0) return;

    await prisma.notification.createMany({
      data: staffUsers.map((u) => ({
        userId: u.id,
        title,
        message,
        type,
        linkUrl,
      })),
    });
  } catch (err) {
    console.error("Error notifying property staff:", err);
  }
}
