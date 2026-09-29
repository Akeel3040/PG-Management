import { prisma } from "./prisma";

interface LogActivityParams {
  userId?: string | null;
  propertyId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: string | null;
  ipAddress?: string | null;
}

export async function logActivity({
  userId,
  propertyId,
  action,
  entity,
  entityId,
  details,
  ipAddress,
}: LogActivityParams) {
  try {
    return await prisma.activityLog.create({
      data: {
        userId: userId ?? undefined,
        propertyId: propertyId ?? undefined,
        action,
        entity,
        entityId: entityId ?? undefined,
        details: details ?? undefined,
        ipAddress: ipAddress ?? undefined,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
    return null;
  }
}
