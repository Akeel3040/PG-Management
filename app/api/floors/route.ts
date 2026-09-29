import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { floorSchema } from "@/lib/validation";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;

    const floors = await prisma.floor.findMany({
      where,
      orderBy: { floorNumber: "asc" },
      include: {
        rooms: {
          select: { id: true, roomNumber: true, roomType: true, capacity: true, status: true },
        },
      },
    });

    return NextResponse.json(floors);
  } catch (error: any) {
    console.error("Fetch floors error:", error);
    return NextResponse.json({ error: "Failed to fetch floors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = floorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const data = result.data;
    const floor = await prisma.floor.create({
      data: {
        propertyId: data.propertyId,
        floorNumber: data.floorNumber,
        floorName: data.floorName,
        description: data.description,
      },
    });

    return NextResponse.json({ success: true, floor }, { status: 201 });
  } catch (error: any) {
    console.error("Create floor error:", error);
    return NextResponse.json({ error: "Failed to create floor" }, { status: 500 });
  }
}
