import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { expenseSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const category = searchParams.get("category");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const where: any = {};
    if (propertyId) where.propertyId = propertyId;
    if (category) where.category = category;

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        property: { select: { id: true, name: true, code: true } },
      },
    });

    const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);

    return NextResponse.json({
      expenses,
      totalExpense,
    });
  } catch (error: any) {
    console.error("Fetch expenses error:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" && user.role !== "ACCOUNTANT" && user.role !== "MANAGER")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const result = expenseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const data = result.data;
    const expense = await prisma.expense.create({
      data: {
        propertyId: data.propertyId,
        category: data.category,
        amount: data.amount,
        date: new Date(data.date),
        vendor: data.vendor,
        description: data.description,
        receiptUrl: data.receiptUrl,
        notes: data.notes,
        paidById: user.id,
      },
    });

    await logActivity({
      userId: user.id,
      propertyId: data.propertyId,
      action: "EXPENSE_ADDED",
      entity: "Expense",
      entityId: expense.id,
      details: `Added ${data.category} expense of ₹${data.amount} (${data.description})`,
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    console.error("Create expense error:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
