import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { complaintSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";
import { notifyPropertyStaff } from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const category = searchParams.get("category");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.category = category;

    if (user.role === "TENANT" && user.tenantId) {
      where.tenantId = user.tenantId;
    }

    const complaints = await prisma.complaint.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            room: { select: { roomNumber: true } },
            bed: { select: { bedNumber: true } },
          },
        },
        property: { select: { id: true, name: true, code: true } },
        assignedStaff: { select: { id: true, name: true, phone: true } },
      },
    });

    return NextResponse.json(complaints);
  } catch (error: any) {
    console.error("Fetch complaints error:", error);
    return NextResponse.json({ error: "Failed to fetch complaints" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const result = complaintSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    let tenantId = user.tenantId;

    if (!tenantId && body.tenantId) {
      tenantId = body.tenantId;
    }

    if (!tenantId) {
      return NextResponse.json({ error: "A valid tenant must be associated with the complaint." }, { status: 400 });
    }

    const ticketNumber = `CMP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const complaint = await prisma.complaint.create({
      data: {
        ticketNumber,
        tenantId,
        propertyId: data.propertyId,
        category: data.category,
        title: data.title,
        description: data.description,
        priority: data.priority,
        imageUrl: data.imageUrl,
        status: "OPEN",
      },
      include: {
        tenant: { select: { fullName: true } },
      },
    });

    await logActivity({
      userId: user.id,
      propertyId: data.propertyId,
      action: "COMPLAINT_CREATED",
      entity: "Complaint",
      entityId: complaint.id,
      details: `Created complaint ${ticketNumber} (${data.title})`,
    });

    await notifyPropertyStaff(
      data.propertyId,
      `New Complaint: ${ticketNumber}`,
      `${complaint.tenant.fullName} reported: ${data.title} [Priority: ${data.priority}]`,
      "COMPLAINT_NEW",
      "/complaints"
    );

    return NextResponse.json({ success: true, complaint }, { status: 201 });
  } catch (error: any) {
    console.error("Create complaint error:", error);
    return NextResponse.json({ error: "Failed to create complaint" }, { status: 500 });
  }
}
