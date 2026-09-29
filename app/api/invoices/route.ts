import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rentInvoiceSchema } from "@/lib/validation";
import { generateRentInvoice } from "@/lib/services/rent.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const billingMonth = searchParams.get("billingMonth");
    const status = searchParams.get("status");
    const tenantId = searchParams.get("tenantId");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (billingMonth) where.billingMonth = billingMonth;
    if (status) where.status = status;
    if (tenantId) where.tenantId = tenantId;

    if (user.role === "TENANT" && user.tenantId) {
      where.tenantId = user.tenantId;
    }

    const invoices = await prisma.rentInvoice.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: {
          select: { id: true, fullName: true, phone: true, email: true },
        },
        property: {
          select: { id: true, name: true, code: true, address: true, phone: true, email: true },
        },
        room: { select: { roomNumber: true } },
        bed: { select: { bedNumber: true } },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
      },
    });

    return NextResponse.json(invoices);
  } catch (error: any) {
    console.error("Fetch invoices error:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "ACCOUNTANT" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = rentInvoiceSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const invoice = await generateRentInvoice({
      ...result.data,
      currentUserId: user.id,
    });

    return NextResponse.json({ success: true, invoice }, { status: 201 });
  } catch (error: any) {
    console.error("Create invoice error:", error);
    if (error.message === "INVOICE_ALREADY_EXISTS") {
      return NextResponse.json(
        { error: "Invoice for this tenant and billing month already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message || "Failed to create invoice" }, { status: 500 });
  }
}
