import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "TENANT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        user: { select: { id: true, name: true, role: true, email: true } },
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error("Fetch activity logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
