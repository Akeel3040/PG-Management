"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Receipt,
  Plus,
  Filter,
  Search,
  Printer,
  CreditCard,
  Building2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Layers,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate, getInvoiceStatusColor } from "@/lib/utils";

export default function RentPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [billingMonth, setBillingMonth] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [viewInvoiceModal, setViewInvoiceModal] = useState<any>(null);
  const [paymentModal, setPaymentModal] = useState<any>(null);

  const [bulkForm, setBulkForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    billingMonth: new Date().toISOString().slice(0, 7),
    dueDate: new Date(new Date().setDate(5)).toISOString().split("T")[0],
  });

  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/invoices?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      if (billingMonth) url += `billingMonth=${billingMonth}&`;
      if (statusFilter) url += `status=${statusFilter}&`;

      const res = await fetch(url);
      if (res.ok) {
        setInvoices(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [selectedPropertyId, billingMonth, statusFilter]);

  useEffect(() => {
    if (selectedPropertyId) {
      setBulkForm((prev) => ({ ...prev, propertyId: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  const handleBulkGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices/bulk-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bulkForm),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to generate invoices");
        return;
      }

      setBulkModalOpen(false);
      loadInvoices();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModal) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: paymentModal.id,
          tenantId: paymentModal.tenantId,
          propertyId: paymentModal.propertyId,
          amount: paymentAmount,
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod,
          transactionId,
        }),
      });

      if (res.ok) {
        setPaymentModal(null);
        loadInvoices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  // Metrics
  const totalBilled = invoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
  const totalCollected = invoices.reduce((acc, i) => acc + (i.paidAmount || 0), 0);
  const totalPending = invoices.reduce((acc, i) => acc + (i.balanceAmount || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.balanceAmount > 0 && new Date(i.dueDate) < new Date());
  const totalOverdue = overdueInvoices.reduce((acc, i) => acc + i.balanceAmount, 0);

  const filteredInvoices = invoices.filter((i) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      i.invoiceNumber.toLowerCase().includes(q) ||
      i.tenant?.fullName?.toLowerCase().includes(q) ||
      i.room?.roomNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Rent & Invoice Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate monthly rent bills, track dues, record payments, and print invoices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setBulkModalOpen(true)} size="sm">
              <Layers className="h-4 w-4 mr-1.5" /> Bulk Generate Invoices
            </Button>
          </div>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 space-y-1">
              <span className="text-xs text-muted-foreground">Total Billed</span>
              <div className="text-2xl font-bold text-foreground">{formatCurrency(totalBilled)}</div>
              <p className="text-[11px] text-muted-foreground">{invoices.length} invoices</p>
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Total Collected</span>
              <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</div>
              <p className="text-[11px] text-muted-foreground">
                {totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0}% recovery rate
              </p>
            </CardContent>
          </Card>

          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Pending Balance</span>
              <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</div>
              <p className="text-[11px] text-muted-foreground">Active balance</p>
            </CardContent>
          </Card>

          <Card className="border-rose-500/20 bg-rose-500/5">
            <CardContent className="p-4 space-y-1">
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-400">Overdue Rent</span>
              <div className="text-2xl font-bold text-rose-600">{formatCurrency(totalOverdue)}</div>
              <p className="text-[11px] text-muted-foreground">{overdueInvoices.length} past due date</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, tenant, or room..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <Input
            type="month"
            value={billingMonth}
            onChange={(e) => setBillingMonth(e.target.value)}
            className="w-40 h-8 text-xs"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PENDING">Pending</option>
            <option value="OVERDUE">Overdue</option>
          </select>

          {(billingMonth || statusFilter || search) && (
            <button
              onClick={() => {
                setBillingMonth("");
                setStatusFilter("");
                setSearch("");
              }}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Invoices Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Invoice Details</th>
                  <th className="p-3.5">Tenant & Room</th>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Due Date</th>
                  <th className="p-3.5">Total Amount</th>
                  <th className="p-3.5">Paid</th>
                  <th className="p-3.5">Balance</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">Loading invoices...</td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-muted-foreground">
                      <Receipt className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      No invoices found
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => {
                    const color = getInvoiceStatusColor(inv.status);
                    return (
                      <tr key={inv.id} className="hover:bg-accent/40 transition-colors">
                        <td className="p-3.5">
                          <span className="font-mono font-bold text-primary">{inv.invoiceNumber}</span>
                          <div className="text-[11px] text-muted-foreground">{inv.property?.name}</div>
                        </td>

                        <td className="p-3.5">
                          <Link href={`/tenants/${inv.tenantId}`} className="font-semibold text-foreground hover:underline">
                            {inv.tenant?.fullName}
                          </Link>
                          <div className="text-[11px] text-muted-foreground">
                            Room {inv.room?.roomNumber || "-"} • Bed {inv.bed?.bedNumber || "-"}
                          </div>
                        </td>

                        <td className="p-3.5 font-medium">{inv.billingMonth}</td>
                        <td className="p-3.5 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                        <td className="p-3.5 font-bold text-foreground">{formatCurrency(inv.totalAmount)}</td>
                        <td className="p-3.5 font-medium text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                        <td className="p-3.5 font-bold text-rose-600">{formatCurrency(inv.balanceAmount)}</td>

                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                            {inv.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {inv.balanceAmount > 0 && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setPaymentModal(inv);
                                  setPaymentAmount(inv.balanceAmount);
                                }}
                                className="text-xs h-7 px-2"
                              >
                                Pay
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setViewInvoiceModal(inv)}
                              className="text-xs h-7 px-2"
                            >
                              <Printer className="h-3 w-3 mr-1" /> View
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Bulk Invoicing */}
        <Modal
          isOpen={bulkModalOpen}
          onClose={() => setBulkModalOpen(false)}
          title="Bulk Generate Rent Invoices"
          description="Automatically generate rent invoices for all active tenants in a property"
          maxWidth="md"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleBulkGenerate} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Target Property *</label>
              <select
                value={bulkForm.propertyId}
                onChange={(e) => setBulkForm({ ...bulkForm, propertyId: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Billing Month (YYYY-MM) *"
                value={bulkForm.billingMonth}
                onChange={(e) => setBulkForm({ ...bulkForm, billingMonth: e.target.value })}
                placeholder="2026-10"
              />
              <Input
                label="Rent Due Date *"
                type="date"
                value={bulkForm.dueDate}
                onChange={(e) => setBulkForm({ ...bulkForm, dueDate: e.target.value })}
              />
            </div>

            <div className="rounded-lg bg-accent/50 p-3 text-muted-foreground text-xs">
              ⚡ This will scan all active residents and generate an individual rent bill based on their contracted monthly rent.
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setBulkModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Generate Invoices
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: View / Print Invoice */}
        <Modal
          isOpen={!!viewInvoiceModal}
          onClose={() => setViewInvoiceModal(null)}
          title="Rent Invoice & Receipt"
          maxWidth="2xl"
        >
          {viewInvoiceModal && (
            <div className="space-y-6 text-xs printable-area">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border pb-4">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {viewInvoiceModal.property?.name}
                  </h2>
                  <p className="text-muted-foreground">{viewInvoiceModal.property?.address}</p>
                  <p className="text-muted-foreground">Phone: {viewInvoiceModal.property?.phone} • Email: {viewInvoiceModal.property?.email}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono text-base font-extrabold text-primary">
                    {viewInvoiceModal.invoiceNumber}
                  </span>
                  <div className="text-muted-foreground mt-0.5">Billing Month: {viewInvoiceModal.billingMonth}</div>
                  <div className="text-muted-foreground">Due Date: {formatDate(viewInvoiceModal.dueDate)}</div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 rounded-xl bg-accent/30 p-3">
                <div>
                  <span className="text-muted-foreground font-medium">Billed To:</span>
                  <div className="font-bold text-sm text-foreground">{viewInvoiceModal.tenant?.fullName}</div>
                  <div className="text-muted-foreground">{viewInvoiceModal.tenant?.phone} • {viewInvoiceModal.tenant?.email}</div>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground font-medium">Allocated Space:</span>
                  <div className="font-bold text-sm text-foreground">
                    Room {viewInvoiceModal.room?.roomNumber || "-"} • Bed {viewInvoiceModal.bed?.bedNumber || "-"}
                  </div>
                </div>
              </div>

              {/* Invoice Breakdown Table */}
              <table className="w-full text-left">
                <thead className="border-b border-border font-semibold text-muted-foreground">
                  <tr>
                    <th className="py-2">Description</th>
                    <th className="py-2 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  <tr>
                    <td className="py-2 font-medium">Monthly Bed Rent ({viewInvoiceModal.billingMonth})</td>
                    <td className="py-2 text-right">{formatCurrency(viewInvoiceModal.rentAmount)}</td>
                  </tr>
                  {viewInvoiceModal.utilityCharges > 0 && (
                    <tr>
                      <td className="py-2 font-medium">Electricity & Utility Charges</td>
                      <td className="py-2 text-right">{formatCurrency(viewInvoiceModal.utilityCharges)}</td>
                    </tr>
                  )}
                  {viewInvoiceModal.lateFee > 0 && (
                    <tr>
                      <td className="py-2 font-medium">Late Fee / Penalty</td>
                      <td className="py-2 text-right">{formatCurrency(viewInvoiceModal.lateFee)}</td>
                    </tr>
                  )}
                  {viewInvoiceModal.previousBalance > 0 && (
                    <tr>
                      <td className="py-2 font-medium">Previous Unpaid Balance</td>
                      <td className="py-2 text-right">{formatCurrency(viewInvoiceModal.previousBalance)}</td>
                    </tr>
                  )}
                  {viewInvoiceModal.discount > 0 && (
                    <tr>
                      <td className="py-2 font-medium text-emerald-600">Discount Offered</td>
                      <td className="py-2 text-right text-emerald-600">-{formatCurrency(viewInvoiceModal.discount)}</td>
                    </tr>
                  )}
                  <tr className="border-t-2 border-border font-bold">
                    <td className="py-2.5 text-foreground">Total Payable Amount</td>
                    <td className="py-2.5 text-right text-foreground">{formatCurrency(viewInvoiceModal.totalAmount)}</td>
                  </tr>
                  <tr>
                    <td className="py-2 text-emerald-600">Amount Paid</td>
                    <td className="py-2 text-right text-emerald-600">{formatCurrency(viewInvoiceModal.paidAmount)}</td>
                  </tr>
                  <tr className="font-bold text-sm">
                    <td className="py-2 text-rose-600">Current Balance Due</td>
                    <td className="py-2 text-right text-rose-600">{formatCurrency(viewInvoiceModal.balanceAmount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border no-print">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1.5" /> Print / Save PDF
                </Button>
                <Button onClick={() => setViewInvoiceModal(null)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Modal: Pay Invoice */}
        <Modal
          isOpen={!!paymentModal}
          onClose={() => setPaymentModal(null)}
          title={`Pay Invoice ${paymentModal?.invoiceNumber}`}
          description={`Balance due: ${formatCurrency(paymentModal?.balanceAmount)}`}
          maxWidth="sm"
        >
          <form onSubmit={handlePayInvoice} className="space-y-4 text-xs">
            <Input
              label="Payment Amount (₹) *"
              type="number"
              min={1}
              max={paymentModal?.balanceAmount}
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Payment Method *</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / QR)</option>
                <option value="CASH">Cash at Counter</option>
                <option value="BANK_TRANSFER">Bank Transfer (IMPS/NEFT)</option>
                <option value="CARD">Credit / Debit Card</option>
              </select>
            </div>

            <Input
              label="UPI Ref / Transaction ID"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="e.g. UPI4930194832"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setPaymentModal(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Confirm Payment
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
