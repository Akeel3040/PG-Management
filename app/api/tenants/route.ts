import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { tenantOnboardingSchema } from "@/lib/validation";
import { onboardTenant } from "@/lib/services/tenant.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { room: { roomNumber: { contains: search, mode: "insensitive" } } },
        { bed: { bedNumber: { contains: search, mode: "insensitive" } } },
      ];
    }

    // Tenant role isolation: can only see self
    if (user.role === "TENANT" && user.tenantId) {
      where.id = user.tenantId;
    }

    const tenants = await prisma.tenant.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        property: { select: { id: true, name: true, code: true } },
        room: { select: { id: true, roomNumber: true, roomType: true } },
        bed: { select: { id: true, bedNumber: true } },
        invoices: {
          select: { id: true, balanceAmount: true, status: true, totalAmount: true },
        },
      },
    });

    const enriched = tenants.map((t) => {
      const pendingDues = t.invoices
        .filter((i) => i.status !== "PAID" && i.status !== "WAIVED")
        .reduce((acc, i) => acc + (i.balanceAmount || 0), 0);

      return {
        ...t,
        pendingDues,
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    console.error("Fetch tenants error:", error);
    return NextResponse.json({ error: "Failed to fetch tenants" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = tenantOnboardingSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const tenant = await onboardTenant({
      ...result.data,
      currentUserId: user.id,
    });

    return NextResponse.json({ success: true, tenant }, { status: 201 });
  } catch (error: any) {
    console.error("Onboard tenant error:", error);
    if (error.message === "BED_NOT_AVAILABLE" || error.message === "BED_ALREADY_OCCUPIED") {
      return NextResponse.json({ error: "Selected bed is already occupied or unavailable." }, { status: 400 });
    }
    return NextResponse.json({ error: error.message || "Failed to onboard tenant" }, { status: 500 });
  }
}
