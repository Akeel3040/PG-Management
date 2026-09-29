import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { paymentSchema } from "@/lib/validation";
import { recordPayment } from "@/lib/services/rent.service";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const paymentMethod = searchParams.get("paymentMethod");
    const tenantId = searchParams.get("tenantId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (paymentMethod) where.paymentMethod = paymentMethod;
    if (tenantId) where.tenantId = tenantId;

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    if (user.role === "TENANT" && user.tenantId) {
      where.tenantId = user.tenantId;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        tenant: { select: { id: true, fullName: true, phone: true, email: true } },
        property: { select: { id: true, name: true, code: true } },
        invoice: { select: { id: true, invoiceNumber: true, billingMonth: true, totalAmount: true } },
        receivedBy: { select: { id: true, name: true } },
      },
    });

    const totalCollected = payments.reduce((acc, p) => acc + p.amount, 0);

    return NextResponse.json({
      payments,
      totalCollected,
    });
  } catch (error: any) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Allowed: Owner, Accountant, Manager, or Tenant paying own invoice
    const body = await req.json();

    // If tenant paying, enforce tenantId is self
    if (user.role === "TENANT") {
      if (!user.tenantId || body.tenantId !== user.tenantId) {
        return NextResponse.json({ error: "Tenants can only pay their own rent" }, { status: 403 });
      }
    }

    const result = paymentSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const payment = await recordPayment({
      ...result.data,
      currentUserId: user.id,
    });

    return NextResponse.json({ success: true, payment }, { status: 201 });
  } catch (error: any) {
    console.error("Record payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 500 });
  }
}
