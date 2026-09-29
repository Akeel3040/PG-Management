import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { propertySchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status");

    const where: any = {};
    if (user.role === "MANAGER" || user.role === "STAFF" || user.role === "ACCOUNTANT") {
      if (user.assignedPropertyId) {
        where.id = user.assignedPropertyId;
      }
    } else if (user.role === "TENANT") {
      if (user.assignedPropertyId) {
        where.id = user.assignedPropertyId;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const properties = await prisma.property.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        rooms: {
          select: { id: true, status: true, beds: { select: { id: true, status: true } } },
        },
        _count: {
          select: { tenants: true, rooms: true, beds: true, staffMembers: true },
        },
      },
    });

    const enriched = properties.map((p) => {
      const allBeds = p.rooms.flatMap((r) => r.beds);
      const occupiedBeds = allBeds.filter((b) => b.status === "OCCUPIED").length;
      const totalBeds = allBeds.length;
      const occupancy = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

      return {
        ...p,
        totalBeds,
        occupiedBeds,
        occupancy,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Fetch properties error:", error);
    return NextResponse.json({ error: "Failed to fetch properties" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden. Only owners can create properties." }, { status: 403 });
    }

    const body = await req.json();
    const result = propertySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;

    // Check duplicate property code
    const existing = await prisma.property.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Property code '${data.code}' is already in use.` },
        { status: 409 }
      );
    }

    const property = await prisma.property.create({
      data: {
        ownerId: user.id,
        name: data.name,
        code: data.code,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        email: data.email,
        googleMapsUrl: data.googleMapsUrl || null,
        description: data.description || null,
        rules: data.rules || null,
        totalFloors: data.totalFloors,
        status: data.status,
      },
    });

    // Automatically create default floors
    for (let f = 1; f <= data.totalFloors; f++) {
      await prisma.floor.create({
        data: {
          propertyId: property.id,
          floorNumber: f,
          floorName: `${f}${f === 1 ? "st" : f === 2 ? "nd" : f === 3 ? "rd" : "th"} Floor`,
        },
      });
    }

    await logActivity({
      userId: user.id,
      propertyId: property.id,
      action: "PROPERTY_CREATED",
      entity: "Property",
      entityId: property.id,
      details: `Created property ${property.name} (${property.code}) with ${data.totalFloors} floors`,
    });

    return NextResponse.json({ success: true, property }, { status: 201 });
  } catch (error: any) {
    console.error("Create property error:", error);
    return NextResponse.json({ error: "Failed to create property" }, { status: 500 });
  }
}
