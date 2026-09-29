import { prisma } from "@/lib/prisma";
import { BedStatus, TenantStatus, InvoiceStatus } from "@prisma/client";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export async function getDashboardStats(propertyId?: string | null) {
  const propertyFilter = propertyId ? { propertyId } : {};
  const propertyIdFilter = propertyId ? { id: propertyId } : {};

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);

  // Parallel queries for fast performance
  const [
    totalProperties,
    rooms,
    beds,
    totalTenants,
    activeTenantsList,
    currentMonthPayments,
    pendingInvoices,
    currentMonthExpenses,
    recentActivity,
  ] = await Promise.all([
    prisma.property.count({ where: { status: "ACTIVE", ...propertyIdFilter } }),
    prisma.room.findMany({
      where: propertyFilter,
      select: { id: true, beds: { select: { status: true } } },
    }),
    prisma.bed.findMany({
      where: propertyFilter,
      select: { id: true, status: true },
    }),
    prisma.tenant.count({ where: propertyFilter }),
    prisma.tenant.findMany({
      where: { status: TenantStatus.ACTIVE, ...propertyFilter },
      select: { id: true, monthlyRent: true },
    }),
    prisma.payment.findMany({
      where: {
        paymentDate: { gte: currentMonthStart, lte: currentMonthEnd },
        status: "COMPLETED",
        ...propertyFilter,
      },
      select: { amount: true },
    }),
    prisma.rentInvoice.findMany({
      where: {
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.OVERDUE] },
        ...propertyFilter,
      },
      select: { balanceAmount: true, dueDate: true, status: true },
    }),
    prisma.expense.findMany({
      where: {
        date: { gte: currentMonthStart, lte: currentMonthEnd },
        ...propertyFilter,
      },
      select: { amount: true },
    }),
    prisma.activityLog.findMany({
      where: propertyFilter,
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, role: true } },
      },
    }),
  ]);

  const totalRooms = rooms.length;
  const vacantRooms = rooms.filter(
    (r) => r.beds.length > 0 && r.beds.every((b) => b.status === BedStatus.AVAILABLE)
  ).length;

  const totalBeds = beds.length;
  const occupiedBeds = beds.filter((b) => b.status === BedStatus.OCCUPIED).length;
  const availableBeds = beds.filter((b) => b.status === BedStatus.AVAILABLE).length;
  const reservedBeds = beds.filter((b) => b.status === BedStatus.RESERVED).length;
  const maintenanceBeds = beds.filter((b) => b.status === BedStatus.MAINTENANCE).length;

  const activeTenants = activeTenantsList.length;
  const monthlyExpectedRent = activeTenantsList.reduce((acc, t) => acc + (t.monthlyRent || 0), 0);

  const monthlyCollectedRent = currentMonthPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const monthlyExpenses = currentMonthExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netIncome = monthlyCollectedRent - monthlyExpenses;

  const pendingRent = pendingInvoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);
  const overdueRent = pendingInvoices
    .filter((inv) => new Date(inv.dueDate) < now)
    .reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const occupancyPercentage = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  // Chart data: Last 6 months trend
  const chartMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = subMonths(now, i);
    const mStart = startOfMonth(d);
    const mEnd = endOfMonth(d);
    const mLabel = format(d, "MMM yyyy");

    chartMonths.push({
      start: mStart,
      end: mEnd,
      label: mLabel,
    });
  }

  const revenueTrend = await Promise.all(
    chartMonths.map(async ({ start, end, label }) => {
      const [revResult, expResult] = await Promise.all([
        prisma.payment.aggregate({
          where: {
            paymentDate: { gte: start, lte: end },
            status: "COMPLETED",
            ...propertyFilter,
          },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: {
            date: { gte: start, lte: end },
            ...propertyFilter,
          },
          _sum: { amount: true },
        }),
      ]);

      const revenue = revResult._sum.amount || 0;
      const expense = expResult._sum.amount || 0;
      return {
        month: label,
        revenue,
        expense,
        profit: revenue - expense,
      };
    })
  );

  return {
    metrics: {
      totalProperties,
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      reservedBeds,
      maintenanceBeds,
      vacantRooms,
      totalTenants,
      activeTenants,
      monthlyExpectedRent,
      monthlyCollectedRent,
      pendingRent,
      overdueRent,
      monthlyExpenses,
      netIncome,
      occupancyPercentage,
    },
    revenueTrend,
    recentActivity,
  };
}
