import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { roomSchema } from "@/lib/validation";

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
    const result = roomSchema.partial().safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const room = await prisma.room.update({
      where: { id: params.id },
      data: result.data,
    });

    return NextResponse.json({ success: true, room });
  } catch (error: any) {
    console.error("Update room error:", error);
    return NextResponse.json({ error: "Failed to update room" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if active beds exist
    const activeBeds = await prisma.bed.count({
      where: { roomId: params.id, status: "OCCUPIED" },
    });

    if (activeBeds > 0) {
      return NextResponse.json(
        { error: "Cannot delete room with active occupied beds. Check out tenants first." },
        { status: 400 }
      );
    }

    await prisma.room.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: "Room deleted successfully" });
  } catch (error: any) {
    console.error("Delete room error:", error);
    return NextResponse.json({ error: "Failed to delete room" }, { status: 500 });
  }
}
