import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { generateRentInvoice } from "@/lib/services/rent.service";

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { propertyId, billingMonth, dueDate } = body;

    if (!propertyId || !billingMonth || !dueDate) {
      return NextResponse.json(
        { error: "propertyId, billingMonth (YYYY-MM), and dueDate are required." },
        { status: 400 }
      );
    }

    // Fetch all active tenants for this property
    const activeTenants = await prisma.tenant.findMany({
      where: {
        propertyId,
        status: { in: ["ACTIVE", "NOTICE_PERIOD"] },
      },
    });

    if (activeTenants.length === 0) {
      return NextResponse.json(
        { message: "No active tenants found for this property.", generatedCount: 0 },
        { status: 200 }
      );
    }

    let generatedCount = 0;
    const errors: string[] = [];

    for (const tenant of activeTenants) {
      try {
        await generateRentInvoice({
          tenantId: tenant.id,
          propertyId,
          billingMonth,
          dueDate,
          rentAmount: tenant.monthlyRent,
          currentUserId: user.id,
        });
        generatedCount++;
      } catch (err: any) {
        if (err.message === "INVOICE_ALREADY_EXISTS") {
          // Already generated for this tenant, skip
          continue;
        }
        errors.push(`${tenant.fullName}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCount} rent invoices for ${billingMonth}.`,
      generatedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error: any) {
    console.error("Bulk generate invoices error:", error);
    return NextResponse.json({ error: "Failed to generate bulk invoices" }, { status: 500 });
  }
}
