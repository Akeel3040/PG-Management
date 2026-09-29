import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roomSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const floorId = searchParams.get("floorId");
    const roomType = searchParams.get("roomType");
    const status = searchParams.get("status");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (floorId) where.floorId = floorId;
    if (roomType) where.roomType = roomType;
    if (status) where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      orderBy: { roomNumber: "asc" },
      include: {
        floor: { select: { floorNumber: true, floorName: true } },
        property: { select: { id: true, name: true, code: true } },
        beds: {
          orderBy: { bedNumber: "asc" },
          include: {
            tenant: {
              select: { id: true, fullName: true, phone: true, profilePhoto: true, status: true },
            },
          },
        },
      },
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error("Fetch rooms error:", error);
    return NextResponse.json({ error: "Failed to fetch rooms" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = roomSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check duplicate room number in property
    const existing = await prisma.room.findFirst({
      where: { propertyId: data.propertyId, roomNumber: data.roomNumber },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Room ${data.roomNumber} already exists in this property` },
        { status: 409 }
      );
    }

    // Create room and create initial beds in a transaction
    const room = await prisma.$transaction(async (tx) => {
      const newRoom = await tx.room.create({
        data: {
          propertyId: data.propertyId,
          floorId: data.floorId,
          roomNumber: data.roomNumber,
          roomType: data.roomType,
          capacity: data.capacity,
          numberOfBeds: data.numberOfBeds,
          hasAc: data.hasAc,
          hasAttachedBathroom: data.hasAttachedBathroom,
          baseRent: data.baseRent,
          securityDeposit: data.securityDeposit,
          status: data.status,
        },
      });

      // Auto-generate beds e.g. "101-A", "101-B" or "A", "B"
      const bedLetters = ["A", "B", "C", "D", "E", "F"];
      for (let i = 0; i < data.numberOfBeds; i++) {
        const bedSuffix = bedLetters[i] || `${i + 1}`;
        const bedNumber = `${data.roomNumber}-${bedSuffix}`;
        await tx.bed.create({
          data: {
            propertyId: data.propertyId,
            roomId: newRoom.id,
            bedNumber,
            monthlyRent: data.baseRent,
            securityDeposit: data.securityDeposit,
            status: "AVAILABLE",
          },
        });
      }

      await tx.activityLog.create({
        data: {
          userId: user.id,
          propertyId: data.propertyId,
          action: "ROOM_CREATED",
          entity: "Room",
          entityId: newRoom.id,
          details: `Created Room ${data.roomNumber} with ${data.numberOfBeds} beds`,
        },
      });

      return newRoom;
    });

    return NextResponse.json({ success: true, room }, { status: 201 });
  } catch (error: any) {
    console.error("Create room error:", error);
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 });
  }
}
