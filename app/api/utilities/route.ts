import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { utilityReadingSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || user.assignedPropertyId;

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    const readings = await prisma.utilityReading.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true } },
        room: { select: { id: true, roomNumber: true } },
      },
    });

    return NextResponse.json(readings);
  } catch (error: any) {
    console.error("Fetch utilities error:", error);
    return NextResponse.json({ error: "Failed to fetch utilities" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "TENANT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const result = utilityReadingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const data = result.data;
    const unitsConsumed = Math.max(0, data.currentReading - data.previousReading);
    const totalAmount = Math.round(unitsConsumed * data.perUnitRate);

    const reading = await prisma.utilityReading.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId || null,
        utilityType: data.utilityType,
        billingMonth: data.billingMonth,
        previousReading: data.previousReading,
        currentReading: data.currentReading,
        unitsConsumed,
        perUnitRate: data.perUnitRate,
        totalAmount,
        isShared: data.isShared,
      },
    });

    return NextResponse.json({ success: true, reading }, { status: 201 });
  } catch (error: any) {
    console.error("Record utility reading error:", error);
    return NextResponse.json({ error: "Failed to record reading" }, { status: 500 });
  }
}
