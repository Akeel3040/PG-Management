import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Mark check-out time
    const visitor = await prisma.visitor.update({
      where: { id: params.id },
      data: { checkOutTime: new Date() },
    });

    return NextResponse.json({ success: true, visitor });
  } catch (error: any) {
    console.error("Update visitor checkout error:", error);
    return NextResponse.json({ error: "Failed to check out visitor" }, { status: 500 });
  }
}
