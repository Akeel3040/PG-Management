import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { staffSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const role = searchParams.get("role");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (role) where.role = role;

    const staffList = await prisma.staff.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, code: true } },
        _count: { select: { complaintsAssigned: true } },
      },
    });

    return NextResponse.json(staffList);
  } catch (error: any) {
    console.error("Fetch staff error:", error);
    return NextResponse.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = staffSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const data = result.data;
    const staff = await prisma.staff.create({
      data: {
        propertyId: data.propertyId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        role: data.role,
        salary: data.salary,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
        address: data.address,
        emergencyContact: data.emergencyContact,
        status: data.status,
      },
    });

    await logActivity({
      userId: user.id,
      propertyId: data.propertyId,
      action: "STAFF_ADDED",
      entity: "Staff",
      entityId: staff.id,
      details: `Added staff ${staff.name} (${staff.role})`,
    });

    return NextResponse.json({ success: true, staff }, { status: 201 });
  } catch (error: any) {
    console.error("Add staff error:", error);
    return NextResponse.json({ error: "Failed to add staff" }, { status: 500 });
  }
}
