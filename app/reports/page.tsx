"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  Building2,
  TrendingUp,
  TrendingDown,
  CreditCard,
  FileSpreadsheet,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function ReportsPage() {
  const { selectedPropertyId } = useProperty();
  const [reportType, setReportType] = useState("RENT_COLLECTION");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${reportType}&`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      if (startDate && endDate) url += `startDate=${startDate}&endDate=${endDate}&`;

      const res = await fetch(url);
      if (res.ok) setData(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, [reportType, selectedPropertyId, startDate, endDate]);

  // CSV Export utility
  const exportToCSV = () => {
    if (!data?.data && !data?.expensesByCategory) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    const filename = `${reportType.toLowerCase()}_report_${new Date().toISOString().slice(0, 10)}.csv`;

    if (reportType === "RENT_COLLECTION") {
      csvContent += "Receipt Number,Tenant Name,Contact,Property,Invoice,Payment Date,Payment Mode,Amount\n";
      data.data.forEach((row: any) => {
        csvContent += `"${row.receiptNumber}","${row.tenant?.fullName}","${row.tenant?.phone}","${row.property?.name}","${row.invoice?.invoiceNumber || "-"}","${formatDate(row.paymentDate)}","${row.paymentMethod}","${row.amount}"\n`;
      });
    } else if (reportType === "PENDING_DUES") {
      csvContent += "Invoice Number,Tenant Name,Contact,Property,Room,Bed,Due Date,Total Amount,Paid,Balance Due\n";
      data.data.forEach((row: any) => {
        csvContent += `"${row.invoiceNumber}","${row.tenant?.fullName}","${row.tenant?.phone}","${row.property?.name}","${row.room?.roomNumber || "-"}","${row.bed?.bedNumber || "-"}","${formatDate(row.dueDate)}","${row.totalAmount}","${row.paidAmount}","${row.balanceAmount}"\n`;
      });
    } else if (reportType === "EXPENSES") {
      csvContent += "Category,Description,Vendor,Date,Amount,Property\n";
      data.data.forEach((row: any) => {
        csvContent += `"${row.category}","${row.description}","${row.vendor || "-"}","${formatDate(row.date)}","${row.amount}","${row.property?.name}"\n`;
      });
    } else if (reportType === "OCCUPANCY") {
      csvContent += "Property,Floor,Room Number,Room Type,Total Beds,Occupied Beds,Status\n";
      data.data.forEach((r: any) => {
        const occ = r.beds.filter((b: any) => b.status === "OCCUPIED").length;
        csvContent += `"${r.property?.name}","${r.floor?.floorName}","${r.roomNumber}","${r.roomType}","${r.beds.length}","${occ}","${occ === r.beds.length ? "Full" : "Available"}"\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Business Intelligence & Reports</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Financial reconciliation, collections, occupancy rate, profit & loss, and audit exports
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1.5" /> Export CSV
            </Button>
            <Button onClick={() => window.print()} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
          </div>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
          {[
            { id: "RENT_COLLECTION", label: "Rent Collections" },
            { id: "PENDING_DUES", label: "Pending Dues & Overdue" },
            { id: "OCCUPANCY", label: "Occupancy & Capacity" },
            { id: "PROFIT_LOSS", label: "Profit & Loss (P&L)" },
            { id: "EXPENSES", label: "Operational Expenses" },
          ].map((r) => (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
                reportType === r.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Date range filter */}
        <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-border flex-wrap text-xs">
          <span className="text-muted-foreground">Filter Date Range:</span>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-primary hover:underline ml-auto"
            >
              Clear Dates
            </button>
          )}
        </div>

        {/* REPORT CONTENT: RENT COLLECTION */}
        {reportType === "RENT_COLLECTION" && (
          <div className="space-y-4 printable-area">
            <Card className="border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Rent Collected</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-0.5">
                    {formatCurrency(data?.totalAmount)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {data?.data?.length || 0} Transactions
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Tenant Name</th>
                    <th className="p-3">Property</th>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Payment Date</th>
                    <th className="p-3">Payment Mode</th>
                    <th className="p-3 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.data?.map((p: any) => (
                    <tr key={p.id} className="hover:bg-accent/40">
                      <td className="p-3 font-mono font-bold text-primary">{p.receiptNumber}</td>
                      <td className="p-3 font-semibold">{p.tenant?.fullName}</td>
                      <td className="p-3 text-muted-foreground">{p.property?.name}</td>
                      <td className="p-3 text-muted-foreground">{p.invoice?.invoiceNumber || "-"}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                      <td className="p-3">{p.paymentMethod}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">{formatCurrency(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT CONTENT: PENDING DUES */}
        {reportType === "PENDING_DUES" && (
          <div className="space-y-4 printable-area">
            <Card className="border-rose-500/20 bg-rose-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Total Outstanding Balance</span>
                  <div className="text-2xl font-bold text-rose-600 mt-0.5">
                    {formatCurrency(data?.totalPending)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {data?.data?.length || 0} Pending / Overdue Invoices
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Tenant Name</th>
                    <th className="p-3">Room & Bed</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Paid Amount</th>
                    <th className="p-3 text-right">Balance Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.data?.map((i: any) => (
                    <tr key={i.id} className="hover:bg-accent/40">
                      <td className="p-3 font-mono font-bold text-primary">{i.invoiceNumber}</td>
                      <td className="p-3 font-semibold">{i.tenant?.fullName}</td>
                      <td className="p-3 text-muted-foreground">Room {i.room?.roomNumber} ({i.bed?.bedNumber})</td>
                      <td className="p-3 text-rose-600 font-medium">{formatDate(i.dueDate)}</td>
                      <td className="p-3">{formatCurrency(i.totalAmount)}</td>
                      <td className="p-3 text-emerald-600">{formatCurrency(i.paidAmount)}</td>
                      <td className="p-3 text-right font-extrabold text-rose-600">{formatCurrency(i.balanceAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT CONTENT: PROFIT & LOSS */}
        {reportType === "PROFIT_LOSS" && (
          <div className="space-y-6 printable-area">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Income (Revenue)</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {formatCurrency(data?.totalRevenue)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Total Expenses</span>
                  <div className="text-2xl font-bold text-amber-600 mt-1">
                    {formatCurrency(data?.totalExpenses)}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <span className="text-xs font-semibold text-primary">Net Operating Profit</span>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {formatCurrency(data?.netProfit)}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Expense breakdown by category */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Expenditure by Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  {data?.expensesByCategory?.map((c: any) => (
                    <div key={c.category} className="flex items-center justify-between p-2 rounded-lg bg-accent/30">
                      <span className="font-semibold">{c.category.replace("_", " ")}</span>
                      <span className="font-bold text-foreground">{formatCurrency(c.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* REPORT CONTENT: OCCUPANCY */}
        {reportType === "OCCUPANCY" && (
          <div className="space-y-4 printable-area">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Card>
                <CardContent className="p-3">
                  <span className="text-xs text-muted-foreground">Total Beds</span>
                  <div className="text-xl font-bold mt-0.5">{data?.stats?.totalBeds}</div>
                </CardContent>
              </Card>
              <Card className="border-emerald-500/20 bg-emerald-500/5">
                <CardContent className="p-3">
                  <span className="text-xs font-semibold text-emerald-700">Occupied</span>
                  <div className="text-xl font-bold text-emerald-600 mt-0.5">{data?.stats?.occupied} ({data?.stats?.occupancyRate}%)</div>
                </CardContent>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-3">
                  <span className="text-xs font-semibold text-primary">Available</span>
                  <div className="text-xl font-bold text-primary mt-0.5">{data?.stats?.available}</div>
                </CardContent>
              </Card>
              <Card className="border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-3">
                  <span className="text-xs font-semibold text-amber-700">Reserved / Maintenance</span>
                  <div className="text-xl font-bold text-amber-600 mt-0.5">{(data?.stats?.reserved || 0) + (data?.stats?.maintenance || 0)}</div>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Property</th>
                    <th className="p-3">Floor</th>
                    <th className="p-3">Room Number</th>
                    <th className="p-3">Room Type</th>
                    <th className="p-3">Beds Count</th>
                    <th className="p-3">Occupied</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.data?.map((r: any) => {
                    const occ = r.beds.filter((b: any) => b.status === "OCCUPIED").length;
                    const isFull = occ === r.beds.length && r.beds.length > 0;
                    return (
                      <tr key={r.id} className="hover:bg-accent/40">
                        <td className="p-3 font-medium">{r.property?.name}</td>
                        <td className="p-3 text-muted-foreground">{r.floor?.floorName}</td>
                        <td className="p-3 font-bold text-foreground">Room {r.roomNumber}</td>
                        <td className="p-3">{r.roomType}</td>
                        <td className="p-3">{r.beds.length} Beds</td>
                        <td className="p-3 font-semibold text-foreground">{occ} Beds</td>
                        <td className="p-3">
                          <Badge variant={isFull ? "secondary" : "success"}>
                            {isFull ? "Full" : "Vacant Slots"}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORT CONTENT: EXPENSES */}
        {reportType === "EXPENSES" && (
          <div className="space-y-4 printable-area">
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Total Expenditure</span>
                  <div className="text-2xl font-bold text-amber-600 mt-0.5">
                    {formatCurrency(data?.totalExpense)}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground text-right">
                  {data?.data?.length || 0} Expense Entries
                </div>
              </CardContent>
            </Card>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Category</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Vendor</th>
                    <th className="p-3">Date</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {data?.data?.map((e: any) => (
                    <tr key={e.id} className="hover:bg-accent/40">
                      <td className="p-3 font-semibold">{e.category.replace("_", " ")}</td>
                      <td className="p-3">{e.description}</td>
                      <td className="p-3 text-muted-foreground">{e.vendor || "-"}</td>
                      <td className="p-3 text-muted-foreground">{formatDate(e.date)}</td>
                      <td className="p-3 text-right font-bold text-amber-600">{formatCurrency(e.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
