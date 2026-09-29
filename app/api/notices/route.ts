import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { noticeSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || user.assignedPropertyId;

    const where: any = {
      status: "PUBLISHED",
    };

    if (propertyId) {
      where.OR = [{ propertyId }, { propertyId: null }];
    }

    const notices = await prisma.notice.findMany({
      where,
      orderBy: { publishDate: "desc" },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(notices);
  } catch (error: any) {
    console.error("Fetch notices error:", error);
    return NextResponse.json({ error: "Failed to fetch notices" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = noticeSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: "Validation failed", details: result.error.flatten() }, { status: 400 });
    }

    const data = result.data;
    const notice = await prisma.notice.create({
      data: {
        propertyId: data.propertyId || null,
        title: data.title,
        content: data.content,
        targetAudience: data.targetAudience,
        priority: data.priority,
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : undefined,
        status: data.status,
      },
    });

    await logActivity({
      userId: user.id,
      propertyId: data.propertyId,
      action: "NOTICE_PUBLISHED",
      entity: "Notice",
      entityId: notice.id,
      details: `Published notice: ${data.title}`,
    });

    return NextResponse.json({ success: true, notice }, { status: 201 });
  } catch (error: any) {
    console.error("Create notice error:", error);
    return NextResponse.json({ error: "Failed to create notice" }, { status: 500 });
  }
}
