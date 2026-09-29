import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { bedSchema } from "@/lib/validation";

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
    const result = bedSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const bed = await prisma.bed.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json({ success: true, bed });
  } catch (error: any) {
    console.error("Update bed error:", error);
    return NextResponse.json({ error: "Failed to update bed" }, { status: 500 });
  }
}
