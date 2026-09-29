import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { bedSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const roomId = searchParams.get("roomId");
    const status = searchParams.get("status");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;

    const beds = await prisma.bed.findMany({
      where,
      orderBy: { bedNumber: "asc" },
      include: {
        room: { select: { roomNumber: true, roomType: true, floor: { select: { floorName: true } } } },
        property: { select: { id: true, name: true } },
        tenant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            email: true,
            joiningDate: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(beds);
  } catch (error: any) {
    console.error("Fetch beds error:", error);
    return NextResponse.json({ error: "Failed to fetch beds" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = bedSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check duplicate bed in same room
    const existing = await prisma.bed.findFirst({
      where: { roomId: data.roomId, bedNumber: data.bedNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Bed ${data.bedNumber} already exists in this room` },
        { status: 409 }
      );
    }

    const bed = await prisma.bed.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        bedNumber: data.bedNumber,
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit,
        status: data.status,
      },
    });

    return NextResponse.json({ success: true, bed }, { status: 201 });
  } catch (error: any) {
    console.error("Create bed error:", error);
    return NextResponse.json({ error: "Failed to create bed" }, { status: 500 });
  }
}
