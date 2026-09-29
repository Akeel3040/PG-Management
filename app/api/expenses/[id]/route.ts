import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "ACCOUNTANT")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const expense = await prisma.expense.delete({
      where: { id: params.id },
    });

    await logActivity({
      userId: user.id,
      propertyId: expense.propertyId,
      action: "EXPENSE_DELETED",
      entity: "Expense",
      entityId: expense.id,
      details: `Deleted expense of ₹${expense.amount} (${expense.description})`,
    });

    return NextResponse.json({ success: true, message: "Expense deleted" });
  } catch (error: any) {
    console.error("Delete expense error:", error);
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
