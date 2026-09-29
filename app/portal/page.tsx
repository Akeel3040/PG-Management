"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  Bell,
  FileText,
  Clock,
  Plus,
  Printer,
  ShieldCheck,
  CheckCircle2,
  LogOut,
  User,
  Building2,
  Sun,
  Moon,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { useAuth } from "@/components/auth-context";
import { useTheme } from "@/components/theme-provider";
import { formatCurrency, formatDate, getInvoiceStatusColor, getComplaintStatusColor } from "@/lib/utils";

export default function TenantPortalPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [tenant, setTenant] = useState<any>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dues");

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace("/login");
      } else if (user.role !== "TENANT") {
        router.replace("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab && ["dues", "payments", "complaints", "notices", "agreement"].includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, []);

  // Modals
  const [payModal, setPayModal] = useState<any>(null);
  const [complaintModalOpen, setComplaintModalOpen] = useState(false);
  const [receiptModal, setReceiptModal] = useState<any>(null);

  // Forms
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState("UPI");
  const [txnId, setTxnId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [complaintForm, setComplaintForm] = useState({
    category: "MAINTENANCE",
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  const loadPortalData = async () => {
    if (!user?.tenantId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [tRes, nRes] = await Promise.all([
        fetch(`/api/tenants/${user.tenantId}`),
        fetch(`/api/notices`),
      ]);

      if (tRes.ok) setTenant(await tRes.json());
      if (nRes.ok) setNotices(await nRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [user]);

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModal || !tenant) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: payModal.id,
          tenantId: tenant.id,
          propertyId: tenant.propertyId,
          amount: payAmount,
          paymentDate: new Date().toISOString().split("T")[0],
          paymentMethod: payMethod,
          transactionId: txnId || `UPI-${Date.now().toString().slice(-6)}`,
        }),
      });

      if (res.ok) {
        setPayModal(null);
        loadPortalData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...complaintForm,
          propertyId: tenant.propertyId,
          tenantId: tenant.id,
        }),
      });

      if (res.ok) {
        setComplaintModalOpen(false);
        setComplaintForm({
          category: "MAINTENANCE",
          title: "",
          description: "",
          priority: "MEDIUM",
        });
        loadPortalData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="text-xs text-muted-foreground">Loading Resident Portal...</div>
      </div>
    );
  }

  const tabs = [
    { id: "dues", label: "My Invoices & Rent Dues", icon: <Receipt className="h-4 w-4" /> },
    { id: "payments", label: "Payment Receipts", icon: <CreditCard className="h-4 w-4" /> },
    { id: "complaints", label: "Maintenance Requests", icon: <MessageSquareWarning className="h-4 w-4" /> },
    { id: "notices", label: "Hostel Notices", count: notices.length, icon: <Bell className="h-4 w-4" /> },
    { id: "agreement", label: "My Agreement", icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card px-4 sm:px-8 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Resident Portal</h1>
            <p className="text-[10px] text-muted-foreground">{tenant?.property?.name || "Hostel Living"}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <span>{user?.name}</span>
            <Badge variant="outline">Resident</Badge>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs text-destructive hover:underline ml-2"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* Main container */}
      <main className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Welcome & Room Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="md:col-span-2 border-primary/30 bg-primary/5">
            <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                  Welcome, {tenant?.fullName}
                </span>
                <h2 className="text-xl font-extrabold text-foreground mt-0.5">
                  Room {tenant?.room?.roomNumber || "-"} • Bed {tenant?.bed?.bedNumber || "-"}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {tenant?.property?.name} • {tenant?.property?.address}
                </p>
              </div>
              <div className="text-right sm:border-l sm:border-primary/20 sm:pl-6">
                <span className="text-xs text-muted-foreground">Monthly Bed Rent</span>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(tenant?.monthlyRent)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dues Card */}
          <Card className={tenant?.financialSummary?.totalPendingDues > 0 ? "border-rose-500/30 bg-rose-500/5" : ""}>
            <CardContent className="p-5 flex flex-col justify-between h-full space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Current Pending Dues
              </span>
              <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
                {formatCurrency(tenant?.financialSummary?.totalPendingDues)}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {tenant?.financialSummary?.totalPendingDues > 0 ? "Rent payment due" : "All clear! ✓"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab switcher */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: INVOICES & DUES */}
        {activeTab === "dues" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Monthly Rent Bills</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Invoice #</th>
                    <th className="p-3.5">Month</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Amount</th>
                    <th className="p-3.5">Balance Due</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant?.invoices?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No invoices generated yet</td>
                    </tr>
                  ) : (
                    tenant?.invoices?.map((inv: any) => {
                      const color = getInvoiceStatusColor(inv.status);
                      return (
                        <tr key={inv.id} className="hover:bg-accent/40">
                          <td className="p-3.5 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                          <td className="p-3.5 font-medium">{inv.billingMonth}</td>
                          <td className="p-3.5 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                          <td className="p-3.5 font-semibold">{formatCurrency(inv.totalAmount)}</td>
                          <td className="p-3.5 font-bold text-rose-600">{formatCurrency(inv.balanceAmount)}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            {inv.balanceAmount > 0 ? (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setPayModal(inv);
                                  setPayAmount(inv.balanceAmount);
                                }}
                                className="text-xs h-7 px-3"
                              >
                                Pay Now
                              </Button>
                            ) : (
                              <span className="text-emerald-600 font-semibold">Cleared ✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: PAYMENTS & RECEIPTS */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Payment History & Official Receipts</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Receipt #</th>
                    <th className="p-3.5">Amount Paid</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Payment Mode</th>
                    <th className="p-3.5">Transaction ID</th>
                    <th className="p-3.5 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant?.payments?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No payment history found</td>
                    </tr>
                  ) : (
                    tenant?.payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-accent/40">
                        <td className="p-3.5 font-mono font-bold text-emerald-600">{p.receiptNumber}</td>
                        <td className="p-3.5 font-bold text-sm text-foreground">{formatCurrency(p.amount)}</td>
                        <td className="p-3.5 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                        <td className="p-3.5">{p.paymentMethod}</td>
                        <td className="p-3.5 font-mono text-[11px] text-muted-foreground">{p.transactionId || "-"}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReceiptModal(p)}
                            className="text-xs h-7 px-2"
                          >
                            <Printer className="h-3 w-3 mr-1" /> View Receipt
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">My Maintenance & Service Tickets</h3>
              <Button size="sm" onClick={() => setComplaintModalOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" /> File New Request
              </Button>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3.5">Ticket #</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Resolution Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant?.complaints?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No maintenance tickets filed</td>
                    </tr>
                  ) : (
                    tenant?.complaints?.map((c: any) => {
                      const color = getComplaintStatusColor(c.status);
                      return (
                        <tr key={c.id} className="hover:bg-accent/40">
                          <td className="p-3.5 font-mono font-bold text-primary">{c.ticketNumber}</td>
                          <td className="p-3.5">{c.category}</td>
                          <td className="p-3.5 font-semibold text-foreground">{c.title}</td>
                          <td className="p-3.5">{c.priority}</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-muted-foreground">{c.resolutionNotes || "Pending review by staff"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: NOTICES */}
        {activeTab === "notices" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Hostel Announcements & Notice Board</h3>
            <div className="space-y-3">
              {notices.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6">No announcements published</p>
              ) : (
                notices.map((n) => (
                  <Card key={n.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                      <span className="text-[11px] text-muted-foreground">{formatDate(n.publishDate)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">{n.content}</p>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 5: AGREEMENT */}
        {activeTab === "agreement" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Hostel Lease Agreement</h3>
            {tenant?.agreements?.map((a: any) => (
              <Card key={a.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{a.agreementNumber}</span>
                    <h4 className="text-base font-bold text-foreground mt-0.5">Hostel Tenancy Terms</h4>
                  </div>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Start Date:</span>
                    <div className="font-semibold">{formatDate(a.startDate)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">End Date:</span>
                    <div className="font-semibold">{formatDate(a.endDate)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <div className="font-bold text-emerald-600">{formatCurrency(a.monthlyRent)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Notice Period:</span>
                    <div className="font-semibold">{a.noticePeriodDays} Days</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Pay Now */}
        <Modal
          isOpen={!!payModal}
          onClose={() => setPayModal(null)}
          title={`Pay Rent Bill: ${payModal?.billingMonth}`}
          description={`Invoice ${payModal?.invoiceNumber} • Balance Due: ${formatCurrency(payModal?.balanceAmount)}`}
          maxWidth="sm"
        >
          <form onSubmit={handlePayNow} className="space-y-4 text-xs">
            <Input
              label="Amount to Pay (₹) *"
              type="number"
              min={1}
              max={payModal?.balanceAmount}
              required
              value={payAmount}
              onChange={(e) => setPayAmount(Number(e.target.value))}
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Select Payment Mode *</label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                <option value="CARD">Credit or Debit Card</option>
                <option value="BANK_TRANSFER">Net Banking / IMPS</option>
              </select>
            </div>

            <Input
              label="UPI Ref / Transaction Reference"
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              placeholder="e.g. 423891002341"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setPayModal(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Complete Payment
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: File Complaint */}
        <Modal
          isOpen={complaintModalOpen}
          onClose={() => setComplaintModalOpen(false)}
          title="Lodge Maintenance Request"
          description="Report a room, plumbing, Wi-Fi or cleaning issue"
          maxWidth="md"
        >
          <form onSubmit={handleFileComplaint} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Category *</label>
                <select
                  value={complaintForm.category}
                  onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="ELECTRICITY">Electricity / Geyser</option>
                  <option value="PLUMBING">Plumbing / Water</option>
                  <option value="INTERNET">Wi-Fi / Internet</option>
                  <option value="CLEANING">Cleaning / Housekeeping</option>
                  <option value="FOOD">Food / Mess</option>
                  <option value="ROOM">Room Furniture</option>
                  <option value="MAINTENANCE">General Maintenance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Urgency</label>
                <select
                  value={complaintForm.priority}
                  onChange={(e) => setComplaintForm({ ...complaintForm, priority: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <Input
              label="Brief Title *"
              required
              value={complaintForm.title}
              onChange={(e) => setComplaintForm({ ...complaintForm, title: e.target.value })}
              placeholder="e.g. Wi-Fi router reboot required on 1st floor"
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Description *</label>
              <textarea
                required
                rows={3}
                value={complaintForm.description}
                onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                placeholder="Explain the problem..."
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setComplaintModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Submit Ticket
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Printable Receipt */}
        <Modal
          isOpen={!!receiptModal}
          onClose={() => setReceiptModal(null)}
          title="Payment Acknowledgement Receipt"
          maxWidth="md"
        >
          {receiptModal && (
            <div className="space-y-5 text-xs printable-area">
              <div className="flex items-start justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold text-foreground">{tenant?.property?.name}</h3>
                  <p className="text-muted-foreground">{tenant?.property?.address}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-sm text-emerald-600">
                    {receiptModal.receiptNumber}
                  </span>
                  <div className="text-muted-foreground">{formatDate(receiptModal.paymentDate)}</div>
                </div>
              </div>

              <div className="rounded-lg bg-accent/40 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Received From:</span>
                  <span className="font-bold text-foreground">{tenant?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Allocated Bed:</span>
                  <span>Room {tenant?.room?.roomNumber} • Bed {tenant?.bed?.bedNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Mode:</span>
                  <span className="font-semibold">{receiptModal.paymentMethod}</span>
                </div>
                {receiptModal.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction ID:</span>
                    <span className="font-mono">{receiptModal.transactionId}</span>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Amount Paid</span>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {formatCurrency(receiptModal.amount)}
                  </div>
                </div>
                <Badge variant="success">PAID & VERIFIED</Badge>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border no-print">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1.5" /> Print Receipt
                </Button>
                <Button onClick={() => setReceiptModal(null)}>Close</Button>
              </div>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
}
