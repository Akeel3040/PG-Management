"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  Printer,
  ArrowRight,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function PaymentsPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [payments, setPayments] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [paymentMethod, setPaymentMethod] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Modals
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [viewReceiptModal, setViewReceiptModal] = useState<any>(null);

  // Form
  const [tenantsList, setTenantsList] = useState<any[]>([]);
  const [form, setForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    tenantId: "",
    amount: 10000,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    transactionId: "",
    notes: "",
  });

  const [submitting, setSubmitting] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    try {
      let url = `/api/payments?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      if (paymentMethod) url += `paymentMethod=${paymentMethod}&`;
      if (startDate && endDate) url += `startDate=${startDate}&endDate=${endDate}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        setTotalCollected(data.totalCollected || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [selectedPropertyId, paymentMethod, startDate, endDate]);

  useEffect(() => {
    async function loadTenants() {
      const propId = selectedPropertyId || properties[0]?.id;
      if (!propId) return;
      try {
        const res = await fetch(`/api/tenants?propertyId=${propId}`);
        if (res.ok) setTenantsList(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadTenants();
  }, [selectedPropertyId, properties]);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          propertyId: form.propertyId || selectedPropertyId || properties[0]?.id,
        }),
      });

      if (res.ok) {
        setRecordModalOpen(false);
        loadPayments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = payments.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.receiptNumber.toLowerCase().includes(q) ||
      p.tenant?.fullName?.toLowerCase().includes(q) ||
      p.transactionId?.toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Payment Collections</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprehensive transaction log, receipts, and payment method reconciliations
            </p>
          </div>
          <Button onClick={() => setRecordModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Record Payment
          </Button>
        </div>

        {/* Total Collected Card */}
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Payments Collected
              </span>
              <div className="text-3xl font-extrabold text-emerald-600 mt-0.5">
                {formatCurrency(totalCollected)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right">
              <div>Total Transactions: <strong>{payments.length}</strong></div>
              <div>Cleared with 100% digital audit trace</div>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search receipt #, tenant, or transaction ref..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Payment Modes</option>
            <option value="UPI">UPI</option>
            <option value="CASH">Cash</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
            <option value="CARD">Card</option>
          </select>

          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-36 h-8 text-xs"
          />

          {(paymentMethod || startDate || endDate || search) && (
            <button
              onClick={() => {
                setPaymentMethod("");
                setStartDate("");
                setEndDate("");
                setSearch("");
              }}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Payments Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Receipt #</th>
                  <th className="p-3.5">Tenant</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Transaction Ref</th>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading payments...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      <CreditCard className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      No payments found
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-accent/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-primary">{p.receiptNumber}</td>
                      <td className="p-3.5">
                        <Link href={`/tenants/${p.tenantId}`} className="font-semibold text-foreground hover:underline">
                          {p.tenant?.fullName}
                        </Link>
                        <div className="text-[11px] text-muted-foreground">{p.property?.name}</div>
                      </td>
                      <td className="p-3.5 font-bold text-base text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                          {p.paymentMethod}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{p.transactionId || "-"}</td>
                      <td className="p-3.5 text-muted-foreground">{p.invoice?.invoiceNumber || "-"}</td>
                      <td className="p-3.5 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setViewReceiptModal(p)}
                          className="text-xs h-7 px-2"
                        >
                          <Printer className="h-3 w-3 mr-1" /> Receipt
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Record Payment */}
        <Modal
          isOpen={recordModalOpen}
          onClose={() => setRecordModalOpen(false)}
          title="Record Received Payment"
          description="Log a rent or deposit payment received from a resident"
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Resident / Tenant *</label>
              <select
                required
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="">-- Select Tenant --</option>
                {tenantsList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} ({t.phone}) - Room {t.room?.roomNumber || "-"}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Payment Amount (₹) *"
              type="number"
              min={1}
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Payment Date *"
                type="date"
                required
                value={form.paymentDate}
                onChange={(e) => setForm({ ...form, paymentDate: e.target.value })}
              />
              <div className="space-y-1">
                <label className="font-medium text-foreground">Payment Mode *</label>
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="UPI">UPI</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="CARD">Credit/Debit Card</option>
                </select>
              </div>
            </div>

            <Input
              label="Transaction ID / UTR / Reference"
              value={form.transactionId}
              onChange={(e) => setForm({ ...form, transactionId: e.target.value })}
              placeholder="e.g. UPI48920194"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setRecordModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save & Issue Receipt
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Printable Payment Receipt */}
        <Modal
          isOpen={!!viewReceiptModal}
          onClose={() => setViewReceiptModal(null)}
          title="Payment Acknowledgement Receipt"
          maxWidth="md"
        >
          {viewReceiptModal && (
            <div className="space-y-5 text-xs printable-area">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{viewReceiptModal.property?.name}</h3>
                  <p className="text-muted-foreground">{viewReceiptModal.property?.code}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-600">
                    {viewReceiptModal.receiptNumber}
                  </span>
                  <div className="text-muted-foreground">{formatDate(viewReceiptModal.paymentDate)}</div>
                </div>
              </div>

              <div className="rounded-lg bg-accent/40 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received From:</span>
                  <span className="font-bold text-foreground">{viewReceiptModal.tenant?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contact:</span>
                  <span>{viewReceiptModal.tenant?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <span className="font-semibold">{viewReceiptModal.paymentMethod}</span>
                </div>
                {viewReceiptModal.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono">{viewReceiptModal.transactionId}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Amount Received</span>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {formatCurrency(viewReceiptModal.amount)}
                  </div>
                </div>
                <Badge variant="success">PAID & CLEARED</Badge>
              </div>

              <div className="text-[11px] text-muted-foreground text-center">
                This is a computer generated digital receipt. Thank you for your payment!
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border no-print">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1.5" /> Print Receipt
                </Button>
                <Button onClick={() => setViewReceiptModal(null)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </Shell>
  );
}
