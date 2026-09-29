import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { verificationStatus } = body;

    const doc = await prisma.tenantDocument.update({
      where: { id: params.id },
      data: {
        verificationStatus,
        verifiedAt: verificationStatus === "VERIFIED" ? new Date() : undefined,
        verifiedBy: verificationStatus === "VERIFIED" ? user.name : undefined,
      },
    });

    return NextResponse.json({ success: true, document: doc });
  } catch (error: any) {
    console.error("Update document verification error:", error);
    return NextResponse.json({ error: "Failed to update document" }, { status: 500 });
  }
}
