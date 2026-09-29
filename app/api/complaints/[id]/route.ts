import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { complaintUpdateSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";

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
    const result = complaintUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const isResolved = data.status === "RESOLVED" || data.status === "CLOSED";

    const updated = await prisma.complaint.update({
      where: { id: params.id },
      data: {
        status: data.status,
        priority: data.priority,
        assignedStaffId: data.assignedStaffId || null,
        resolutionNotes: data.resolutionNotes,
        resolvedAt: isResolved ? new Date() : undefined,
      },
      include: {
        tenant: { select: { userId: true, fullName: true } },
      },
    });

    await logActivity({
      userId: user.id,
      propertyId: updated.propertyId,
      action: "COMPLAINT_UPDATED",
      entity: "Complaint",
      entityId: updated.id,
      details: `Complaint ${updated.ticketNumber} status changed to ${data.status}`,
    });

    // If resolved and tenant has a user account, notify them
    if (isResolved && updated.tenant.userId) {
      await createNotification({
        userId: updated.tenant.userId,
        title: `Complaint Resolved: ${updated.ticketNumber}`,
        message: `Your complaint regarding "${updated.title}" has been marked as ${data.status}. Resolution: ${data.resolutionNotes || "Work completed."}`,
        type: "COMPLAINT_RESOLVED",
        linkUrl: "/portal/complaints",
      });
    }

    return NextResponse.json({ success: true, complaint: updated });
  } catch (error: any) {
    console.error("Update complaint error:", error);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
