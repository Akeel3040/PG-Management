import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { tenantCheckOutSchema } from "@/lib/validation";
import { checkOutTenant } from "@/lib/services/tenant.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = tenantCheckOutSchema.safeParse({ ...body, tenantId: params.id });

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const checkoutRecord = await checkOutTenant({
      ...result.data,
      currentUserId: user.id,
    });

    return NextResponse.json({ success: true, checkoutRecord });
  } catch (error: any) {
    console.error("Tenant checkout error:", error);
    return NextResponse.json({ error: error.message || "Failed to process checkout" }, { status: 500 });
  }
}
