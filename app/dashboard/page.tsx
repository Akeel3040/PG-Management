"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Bed,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Clock,
  AlertTriangle,
  Plus,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Receipt,
  UserPlus,
  FilePlus,
  RefreshCw,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";

export default function DashboardPage() {
  const { selectedPropertyId } = useProperty();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const url = selectedPropertyId
        ? `/api/dashboard/stats?propertyId=${selectedPropertyId}`
        : `/api/dashboard/stats`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load dashboard stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedPropertyId]);

  const metrics = data?.metrics || {};

  return (
    <Shell>
      <div className="space-y-6">
        {/* Top Header & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Overview Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live operational and financial performance metrics across your properties
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={fetchStats} isLoading={loading}>
              <RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh
            </Button>
            <Link href="/tenants/new">
              <Button size="sm">
                <UserPlus className="h-3.5 w-3.5 mr-1" /> Onboard Tenant
              </Button>
            </Link>
            <Link href="/payments">
              <Button size="sm" variant="secondary">
                <Receipt className="h-3.5 w-3.5 mr-1" /> Record Payment
              </Button>
            </Link>
            <Link href="/expenses">
              <Button size="sm" variant="outline">
                <Plus className="h-3.5 w-3.5 mr-1" /> Add Expense
              </Button>
            </Link>
          </div>
        </div>

        {/* 1. Primary Metrics Grid (Occupancy & Rooms) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Occupancy</span>
                <Bed className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.occupancyPercentage ?? 0}%</div>
              <p className="text-[11px] text-muted-foreground">
                {metrics.occupiedBeds ?? 0} of {metrics.totalBeds ?? 0} Beds
              </p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Available Beds</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {metrics.availableBeds ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Ready for check-in</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Active Tenants</span>
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">{metrics.activeTenants ?? 0}</div>
              <p className="text-[11px] text-muted-foreground">Total: {metrics.totalTenants ?? 0}</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Total Rooms</span>
                <Building2 className="h-4 w-4 text-slate-500" />
              </div>
              <div className="text-2xl font-bold">{metrics.totalRooms ?? 0}</div>
              <p className="text-[11px] text-muted-foreground">{metrics.vacantRooms ?? 0} vacant rooms</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Reserved Beds</span>
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {metrics.reservedBeds ?? 0}
              </div>
              <p className="text-[11px] text-muted-foreground">Upcoming check-ins</p>
            </CardContent>
          </Card>

          <Card className="hover:border-primary/40 transition-colors">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center justify-between text-muted-foreground">
                <span className="text-xs font-medium">Maintenance</span>
                <AlertTriangle className="h-4 w-4 text-slate-400" />
              </div>
              <div className="text-2xl font-bold text-muted-foreground">{metrics.maintenanceBeds ?? 0}</div>
              <p className="text-[11px] text-muted-foreground">Under repair</p>
            </CardContent>
          </Card>
        </div>

        {/* 2. Financial Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Monthly Collected
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(metrics.monthlyCollectedRent)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-emerald-500/20">
                <span>Expected: {formatCurrency(metrics.monthlyExpectedRent)}</span>
                <span className="font-semibold text-emerald-600">
                  {metrics.monthlyExpectedRent > 0
                    ? `${Math.round((metrics.monthlyCollectedRent / metrics.monthlyExpectedRent) * 100)}%`
                    : "0%"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Pending & Overdue Rent
                </span>
                <Clock className="h-4 w-4 text-rose-600" />
              </div>
              <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(metrics.pendingRent)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-rose-500/20">
                <span>Overdue: {formatCurrency(metrics.overdueRent)}</span>
                <Link href="/rent?status=PENDING" className="text-primary hover:underline flex items-center gap-0.5">
                  View <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Monthly Expenses
                </span>
                <TrendingDown className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {formatCurrency(metrics.monthlyExpenses)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-amber-500/20">
                <span>Ration, bills & staff</span>
                <Link href="/expenses" className="text-primary hover:underline flex items-center gap-0.5">
                  Manage <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Net Operating Income
                </span>
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-primary">
                {formatCurrency(metrics.netIncome)}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-primary/20">
                <span>Revenue - Expenses</span>
                <span className="text-xs font-semibold text-emerald-600">
                  {metrics.monthlyCollectedRent > 0
                    ? `${Math.round((metrics.netIncome / metrics.monthlyCollectedRent) * 100)}% Margin`
                    : "0%"}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3. Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue vs Expense Chart */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Financial Cash Flow (Last 6 Months)</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly rent collected vs operational expenditures
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-72 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.revenueTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} />
                    <YAxis
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(val) => `₹${val >= 1000 ? `${val / 1000}k` : val}`}
                    />
                    <Tooltip
                      formatter={(val: any) => formatCurrency(Number(val))}
                      contentStyle={{
                        borderRadius: "8px",
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        color: "hsl(var(--foreground))",
                        fontSize: "12px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Rent Collected" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expense" name="Expenses" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="profit" name="Net Profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bed Distribution Card */}
          <Card>
            <CardHeader>
              <CardTitle>Bed Allocation Matrix</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Live distribution by status</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Occupied
                  </span>
                  <span className="font-semibold">{metrics.occupiedBeds || 0} Beds ({metrics.occupancyPercentage || 0}%)</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${metrics.occupancyPercentage || 0}%` }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" /> Available
                  </span>
                  <span className="font-semibold">{metrics.availableBeds || 0} Beds</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalBeds > 0
                          ? Math.round((metrics.availableBeds / metrics.totalBeds) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Reserved
                  </span>
                  <span className="font-semibold">{metrics.reservedBeds || 0} Beds</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-amber-500 transition-all duration-500"
                    style={{
                      width: `${
                        metrics.totalBeds > 0
                          ? Math.round((metrics.reservedBeds / metrics.totalBeds) * 100)
                          : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <Link href="/rooms" className="block">
                  <Button variant="outline" size="sm" className="w-full">
                    View Visual Room/Bed Grid <ArrowUpRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </Link>
                <Link href="/reports" className="block">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    Download Occupancy Report (CSV)
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 4. Recent Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity & Audit Trail</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Real-time operational events across properties
              </p>
            </div>
            <Link href="/settings">
              <Button variant="ghost" size="sm" className="text-xs">
                View All Activity
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border/60">
              {data?.recentActivity?.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">No recent activity logged</p>
              ) : (
                data?.recentActivity?.map((act: any) => (
                  <div key={act.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">
                        ✓
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{act.details}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          by <span className="font-semibold">{act.user?.name || "System"}</span> ({act.user?.role || "SYSTEM"}) • Entity: {act.entity}
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatDate(act.createdAt, "dd MMM, hh:mm a")}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Shell>
  );
}
