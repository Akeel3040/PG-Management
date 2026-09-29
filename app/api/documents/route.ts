import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const tenantId = searchParams.get("tenantId") || (user.role === "TENANT" ? user.tenantId : null);

    const where: any = {};
    if (tenantId) where.tenantId = tenantId;

    const docs = await prisma.tenantDocument.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        tenant: { select: { id: true, fullName: true, phone: true, propertyId: true } },
      },
    });

    return NextResponse.json(docs);
  } catch (error: any) {
    console.error("Fetch documents error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { tenantId, title, documentType, fileUrl, expiryDate } = body;

    if (!tenantId || !title || !fileUrl) {
      return NextResponse.json({ error: "tenantId, title, and fileUrl are required" }, { status: 400 });
    }

    const doc = await prisma.tenantDocument.create({
      data: {
        tenantId,
        title,
        documentType: documentType || "OTHER",
        fileUrl,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        verificationStatus: "PENDING",
      },
    });

    return NextResponse.json({ success: true, document: doc }, { status: 201 });
  } catch (error: any) {
    console.error("Create document error:", error);
    return NextResponse.json({ error: "Failed to upload document" }, { status: 500 });
  }
}
