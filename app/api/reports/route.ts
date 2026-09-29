import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role === "TENANT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId") || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN" ? user.assignedPropertyId : null);
    const reportType = searchParams.get("type") || "RENT_COLLECTION";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const propertyFilter = propertyId ? { propertyId } : {};
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.gte = new Date(startDate);
      dateFilter.lte = new Date(endDate);
    }

    switch (reportType) {
      case "RENT_COLLECTION": {
        const payments = await prisma.payment.findMany({
          where: {
            ...propertyFilter,
            ...(startDate && endDate ? { paymentDate: dateFilter } : {}),
            status: "COMPLETED",
          },
          orderBy: { paymentDate: "desc" },
          include: {
            tenant: { select: { fullName: true, phone: true } },
            property: { select: { name: true } },
            invoice: { select: { invoiceNumber: true, billingMonth: true } },
          },
        });

        const totalAmount = payments.reduce((acc, p) => acc + p.amount, 0);
        return NextResponse.json({ type: reportType, data: payments, totalAmount });
      }

      case "PENDING_DUES": {
        const invoices = await prisma.rentInvoice.findMany({
          where: {
            ...propertyFilter,
            status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
          },
          orderBy: { dueDate: "asc" },
          include: {
            tenant: { select: { fullName: true, phone: true } },
            property: { select: { name: true } },
            room: { select: { roomNumber: true } },
            bed: { select: { bedNumber: true } },
          },
        });

        const totalPending = invoices.reduce((acc, i) => acc + i.balanceAmount, 0);
        return NextResponse.json({ type: reportType, data: invoices, totalPending });
      }

      case "EXPENSES": {
        const expenses = await prisma.expense.findMany({
          where: {
            ...propertyFilter,
            ...(startDate && endDate ? { date: dateFilter } : {}),
          },
          orderBy: { date: "desc" },
          include: { property: { select: { name: true } } },
        });

        const totalExpense = expenses.reduce((acc, e) => acc + e.amount, 0);
        return NextResponse.json({ type: reportType, data: expenses, totalExpense });
      }

      case "OCCUPANCY": {
        const rooms = await prisma.room.findMany({
          where: propertyFilter,
          include: {
            property: { select: { name: true } },
            floor: { select: { floorName: true } },
            beds: {
              include: {
                tenant: { select: { fullName: true, phone: true, joiningDate: true } },
              },
            },
          },
        });

        const beds = rooms.flatMap((r) => r.beds);
        const totalBeds = beds.length;
        const occupied = beds.filter((b) => b.status === "OCCUPIED").length;
        const available = beds.filter((b) => b.status === "AVAILABLE").length;
        const reserved = beds.filter((b) => b.status === "RESERVED").length;
        const maintenance = beds.filter((b) => b.status === "MAINTENANCE").length;

        return NextResponse.json({
          type: reportType,
          stats: {
            totalBeds,
            occupied,
            available,
            reserved,
            maintenance,
            occupancyRate: totalBeds > 0 ? Math.round((occupied / totalBeds) * 100) : 0,
          },
          data: rooms,
        });
      }

      case "PROFIT_LOSS": {
        const [payments, expenses] = await Promise.all([
          prisma.payment.findMany({
            where: {
              ...propertyFilter,
              ...(startDate && endDate ? { paymentDate: dateFilter } : {}),
              status: "COMPLETED",
            },
            select: { amount: true },
          }),
          prisma.expense.findMany({
            where: {
              ...propertyFilter,
              ...(startDate && endDate ? { date: dateFilter } : {}),
            },
            select: { amount: true, category: true },
          }),
        ]);

        const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);
        const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
        const netProfit = totalRevenue - totalExpenses;

        // Group expenses by category
        const categoryMap: Record<string, number> = {};
        for (const exp of expenses) {
          categoryMap[exp.category] = (categoryMap[exp.category] || 0) + exp.amount;
        }

        return NextResponse.json({
          type: reportType,
          totalRevenue,
          totalExpenses,
          netProfit,
          expensesByCategory: Object.entries(categoryMap).map(([category, amount]) => ({
            category,
            amount,
          })),
        });
      }

      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Report generation error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
