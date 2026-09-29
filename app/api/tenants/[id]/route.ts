import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tenantOnboardingSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Isolation check
    if (user.role === "TENANT" && user.tenantId !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: params.id },
      include: {
        property: { select: { id: true, name: true, code: true, address: true, phone: true, email: true } },
        room: {
          select: {
            id: true,
            roomNumber: true,
            roomType: true,
            hasAc: true,
            hasAttachedBathroom: true,
            floor: { select: { floorName: true } },
          },
        },
        bed: { select: { id: true, bedNumber: true, monthlyRent: true } },
        invoices: {
          orderBy: { createdAt: "desc" },
          include: { payments: true },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        complaints: {
          orderBy: { createdAt: "desc" },
          include: { assignedStaff: { select: { name: true, phone: true } } },
        },
        visitors: {
          orderBy: { checkInTime: "desc" },
        },
        documents: {
          orderBy: { createdAt: "desc" },
        },
        agreements: {
          orderBy: { createdAt: "desc" },
        },
        checkIns: {
          orderBy: { checkInDate: "desc" },
        },
        checkOuts: {
          orderBy: { checkOutDate: "desc" },
        },
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const totalPaid = tenant.payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalBilled = tenant.invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const totalPendingDues = tenant.invoices
      .filter((i) => i.status !== "PAID" && i.status !== "WAIVED")
      .reduce((acc, i) => acc + (i.balanceAmount || 0), 0);

    return NextResponse.json({
      ...tenant,
      financialSummary: {
        totalBilled,
        totalPaid,
        totalPendingDues,
      },
    });
  } catch (error: any) {
    console.error("Fetch tenant details error:", error);
    return NextResponse.json({ error: "Failed to fetch tenant details" }, { status: 500 });
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
    const result = tenantOnboardingSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const updatedTenant = await prisma.tenant.update({
      where: { id: params.id },
      data: result.data as any,
    });

    await logActivity({
      userId: user.id,
      propertyId: updatedTenant.propertyId,
      action: "TENANT_UPDATED",
      entity: "Tenant",
      entityId: updatedTenant.id,
      details: `Updated details for tenant ${updatedTenant.fullName}`,
    });

    return NextResponse.json({ success: true, tenant: updatedTenant });
  } catch (error: any) {
    console.error("Update tenant error:", error);
    return NextResponse.json({ error: "Failed to update tenant" }, { status: 500 });
  }
}
