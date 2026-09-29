import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { propertySchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const property = await prisma.property.findUnique({
      where: { id: params.id },
      include: {
        amenities: true,
        floors: {
          orderBy: { floorNumber: "asc" },
          include: {
            rooms: {
              include: {
                beds: {
                  include: {
                    tenant: { select: { id: true, fullName: true, phone: true, profilePhoto: true, status: true } },
                  },
                },
              },
            },
          },
        },
        tenants: {
          where: { status: { in: ["ACTIVE", "NOTICE_PERIOD"] } },
          include: {
            room: { select: { roomNumber: true } },
            bed: { select: { bedNumber: true } },
          },
        },
        staffMembers: true,
        complaints: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { tenant: { select: { fullName: true } } },
        },
        notices: {
          orderBy: { publishDate: "desc" },
          take: 5,
        },
      },
    });

    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    // Occupancy calculation
    const allBeds = property.floors.flatMap((f) => f.rooms.flatMap((r) => r.beds));
    const occupiedBeds = allBeds.filter((b) => b.status === "OCCUPIED").length;
    const availableBeds = allBeds.filter((b) => b.status === "AVAILABLE").length;
    const totalBeds = allBeds.length;
    const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return NextResponse.json({
      ...property,
      stats: {
        totalRooms: property.floors.reduce((acc, f) => acc + f.rooms.length, 0),
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyPercentage,
        activeTenants: property.tenants.length,
      },
    });
  } catch (error: any) {
    console.error("Fetch property details error:", error);
    return NextResponse.json({ error: "Failed to fetch property details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = propertySchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const property = await prisma.property.update({
      where: { id: params.id },
      data: result.data,
    });

    await logActivity({
      userId: user.id,
      propertyId: property.id,
      action: "PROPERTY_UPDATED",
      entity: "Property",
      entityId: property.id,
      details: `Updated property details for ${property.name}`,
    });

    return NextResponse.json({ success: true, property });
  } catch (error: any) {
    console.error("Update property error:", error);
    return NextResponse.json({ error: "Failed to update property" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Soft delete/archive
    const property = await prisma.property.update({
      where: { id: params.id },
      data: { status: "ARCHIVED" },
    });

    await logActivity({
      userId: user.id,
      propertyId: property.id,
      action: "PROPERTY_ARCHIVED",
      entity: "Property",
      entityId: property.id,
      details: `Archived property ${property.name}`,
    });

    return NextResponse.json({ success: true, message: "Property archived successfully" });
  } catch (error: any) {
    console.error("Delete property error:", error);
    return NextResponse.json({ error: "Failed to archive property" }, { status: 500 });
  }
}
