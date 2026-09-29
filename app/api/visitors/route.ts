import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { visitorSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const tenantId = searchParams.get("tenantId");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (tenantId) where.tenantId = tenantId;

    if (user.role === "TENANT" && user.tenantId) {
      where.tenantId = user.tenantId;
    }

    const visitors = await prisma.visitor.findMany({
      where,
      orderBy: { checkInTime: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            room: { select: { roomNumber: true } },
            bed: { select: { bedNumber: true } },
          },
        },
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(visitors);
  } catch (error: any) {
    console.error("Fetch visitors error:", error);
    return NextResponse.json({ error: "Failed to fetch visitors" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = visitorSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const data = result.data;
    const visitor = await prisma.visitor.create({
      data: {
        propertyId: data.propertyId,
        tenantId: data.tenantId,
        visitorName: data.visitorName,
        phone: data.phone,
        purpose: data.purpose,
        idType: data.idType,
        idNumber: data.idNumber,
        notes: data.notes,
        checkInTime: new Date(),
      },
      include: {
        tenant: { select: { fullName: true } },
      },
    });

    await logActivity({
      userId: user.id,
      propertyId: data.propertyId,
      action: "VISITOR_LOGGED",
      entity: "Visitor",
      entityId: visitor.id,
      details: `Visitor ${data.visitorName} checked in to visit ${visitor.tenant.fullName}`,
    });

    return NextResponse.json({ success: true, visitor }, { status: 201 });
  } catch (error: any) {
    console.error("Log visitor error:", error);
    return NextResponse.json({ error: "Failed to log visitor" }, { status: 500 });
  }
}
