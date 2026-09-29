"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  Bed,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  Receipt,
  MessageSquareWarning,
  UserCheck,
  FileText,
  Clock,
  ArrowLeft,
  Plus,
  LogOut,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatDate, getInvoiceStatusColor, getComplaintStatusColor } from "@/lib/utils";

export default function TenantProfilePage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("invoices");

  // Modals
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Forms
  const [checkoutForm, setCheckoutForm] = useState({
    checkOutDate: new Date().toISOString().split("T")[0],
    reason: "Agreement completed / Relocation",
    pendingRentDues: 0,
    utilityDues: 0,
    damageCharges: 0,
    refundableDeposit: 0,
    finalSettlementAmount: 0,
    notes: "",
  });

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: "",
    amount: 0,
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "UPI",
    transactionId: "",
    notes: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    billingMonth: new Date().toISOString().slice(0, 7),
    dueDate: new Date(new Date().setDate(5)).toISOString().split("T")[0],
    rentAmount: 0,
    utilityCharges: 500,
    lateFee: 0,
    discount: 0,
    notes: "",
  });

  const loadTenant = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        setTenant(data);
        // Setup default forms with tenant data
        setCheckoutForm((prev) => {
          const dues = data.financialSummary?.totalPendingDues || 0;
          const deposit = data.securityDeposit || 0;
          return {
            ...prev,
            pendingRentDues: dues,
            refundableDeposit: deposit,
            finalSettlementAmount: Math.max(0, deposit - dues),
          };
        });
        setPaymentForm((prev) => ({
          ...prev,
          amount: data.financialSummary?.totalPendingDues || data.monthlyRent,
        }));
        setInvoiceForm((prev) => ({
          ...prev,
          rentAmount: data.monthlyRent,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenant();
  }, [tenantId]);

  const handleProcessCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tenants/${tenantId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...checkoutForm,
          propertyId: tenant.propertyId,
        }),
      });
      if (res.ok) {
        setCheckoutModalOpen(false);
        loadTenant();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentForm,
          tenantId: tenant.id,
          propertyId: tenant.propertyId,
        }),
      });
      if (res.ok) {
        setPaymentModalOpen(false);
        loadTenant();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...invoiceForm,
          tenantId: tenant.id,
          propertyId: tenant.propertyId,
        }),
      });
      if (res.ok) {
        setInvoiceModalOpen(false);
        loadTenant();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Shell>
        <div className="py-24 text-center text-xs text-muted-foreground">Loading tenant profile...</div>
      </Shell>
    );
  }

  if (!tenant) {
    return (
      <Shell>
        <div className="py-24 text-center">
          <h2 className="text-sm font-semibold">Tenant not found</h2>
          <Button onClick={() => router.push("/tenants")} variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Tenants
          </Button>
        </div>
      </Shell>
    );
  }

  const tabs = [
    { id: "invoices", label: "Invoices & Dues", count: tenant.invoices?.length, icon: <Receipt className="h-4 w-4" /> },
    { id: "payments", label: "Payments History", count: tenant.payments?.length, icon: <CreditCard className="h-4 w-4" /> },
    { id: "complaints", label: "Complaints", count: tenant.complaints?.length, icon: <MessageSquareWarning className="h-4 w-4" /> },
    { id: "visitors", label: "Visitors", count: tenant.visitors?.length, icon: <UserCheck className="h-4 w-4" /> },
    { id: "documents", label: "Documents", count: tenant.documents?.length, icon: <FileText className="h-4 w-4" /> },
    { id: "agreement", label: "Agreements", count: tenant.agreements?.length, icon: <FileText className="h-4 w-4" /> },
    { id: "history", label: "Stay History", icon: <Clock className="h-4 w-4" /> },
  ];

  const isCheckedOut = tenant.status === "CHECKED_OUT";

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header with Back button and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/tenants")} variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{tenant.fullName}</h1>
                <Badge
                  variant={
                    tenant.status === "ACTIVE"
                      ? "success"
                      : tenant.status === "NOTICE_PERIOD"
                      ? "warning"
                      : "secondary"
                  }
                >
                  {tenant.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                <span>{tenant.phone}</span>
                <span>•</span>
                <span>{tenant.email}</span>
                <span>•</span>
                <span>{tenant.property?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {!isCheckedOut && (
              <>
                <Button size="sm" onClick={() => setInvoiceModalOpen(true)} variant="outline">
                  <Receipt className="h-3.5 w-3.5 mr-1" /> New Invoice
                </Button>
                <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                  <CreditCard className="h-3.5 w-3.5 mr-1" /> Record Payment
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => setCheckoutModalOpen(true)}
                >
                  <LogOut className="h-3.5 w-3.5 mr-1" /> Check Out
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tenant Summary Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Personal Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender:</span>
                <span className="font-semibold">{tenant.gender}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Occupation:</span>
                <span className="font-semibold">{tenant.occupation || "Professional"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Company / College:</span>
                <span className="font-semibold">{tenant.companyOrCollege || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">KYC Proof:</span>
                <span className="font-semibold">{tenant.idType}: {tenant.idNumber}</span>
              </div>
              <div className="border-t border-border pt-2 text-muted-foreground">
                <div>Emergency: <strong className="text-foreground">{tenant.emergencyContactName}</strong> ({tenant.emergencyContactRelation})</div>
                <div>{tenant.emergencyContactPhone}</div>
              </div>
            </CardContent>
          </Card>

          {/* Room & Bed Info */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Room & Bed Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Room Number:</span>
                <span className="font-bold text-sm bg-secondary px-2 py-0.5 rounded">
                  {tenant.room?.roomNumber || "None"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Bed Number:</span>
                <span className="font-bold text-sm text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {tenant.bed?.bedNumber || "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Room Type:</span>
                <span className="font-semibold">{tenant.room?.roomType || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Joined Date:</span>
                <span className="font-semibold">{formatDate(tenant.joiningDate)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between text-muted-foreground">
                <span>Features:</span>
                <span>{tenant.room?.hasAc ? "AC" : "Non-AC"} • {tenant.room?.hasAttachedBathroom ? "Attached Bath" : "Common"}</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card className={tenant.financialSummary?.totalPendingDues > 0 ? "border-rose-500/30 bg-rose-500/5" : ""}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Financial Balance & Rent
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Monthly Rent:</span>
                <span className="font-bold text-foreground text-sm">{formatCurrency(tenant.monthlyRent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Security Deposit:</span>
                <span className="font-semibold">{formatCurrency(tenant.securityDeposit)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Rent Paid:</span>
                <span className="font-semibold text-emerald-600">{formatCurrency(tenant.financialSummary?.totalPaid)}</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between items-center">
                <span className="font-semibold">Current Pending Dues:</span>
                <span className="font-extrabold text-base text-rose-600 dark:text-rose-400">
                  {formatCurrency(tenant.financialSummary?.totalPendingDues)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: INVOICES */}
        {activeTab === "invoices" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Rent Invoices & Bills</h3>
              {!isCheckedOut && (
                <Button size="sm" onClick={() => setInvoiceModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Generate Invoice
                </Button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Invoice #</th>
                    <th className="p-3">Month</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Rent</th>
                    <th className="p-3">Utilities/Fee</th>
                    <th className="p-3">Total Amount</th>
                    <th className="p-3">Paid</th>
                    <th className="p-3">Balance</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant.invoices?.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-muted-foreground">No invoices generated yet</td>
                    </tr>
                  ) : (
                    tenant.invoices?.map((inv: any) => {
                      const color = getInvoiceStatusColor(inv.status);
                      return (
                        <tr key={inv.id} className="hover:bg-accent/30">
                          <td className="p-3 font-mono font-bold text-primary">{inv.invoiceNumber}</td>
                          <td className="p-3 font-medium">{inv.billingMonth}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                          <td className="p-3">{formatCurrency(inv.rentAmount)}</td>
                          <td className="p-3 text-muted-foreground">
                            {formatCurrency((inv.utilityCharges || 0) + (inv.lateFee || 0))}
                          </td>
                          <td className="p-3 font-semibold">{formatCurrency(inv.totalAmount)}</td>
                          <td className="p-3 text-emerald-600 font-medium">{formatCurrency(inv.paidAmount)}</td>
                          <td className="p-3 font-bold text-rose-600">{formatCurrency(inv.balanceAmount)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                              {inv.status}
                            </span>
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

        {/* TAB 2: PAYMENTS */}
        {activeTab === "payments" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Payment Records</h3>
              {!isCheckedOut && (
                <Button size="sm" onClick={() => setPaymentModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-1.5" /> Record Payment
                </Button>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Receipt #</th>
                    <th className="p-3">Amount</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">Payment Method</th>
                    <th className="p-3">Transaction Ref</th>
                    <th className="p-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant.payments?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-muted-foreground">No payments recorded</td>
                    </tr>
                  ) : (
                    tenant.payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-accent/30">
                        <td className="p-3 font-mono font-bold text-emerald-600">{p.receiptNumber}</td>
                        <td className="p-3 font-bold text-sm text-foreground">{formatCurrency(p.amount)}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(p.paymentDate)}</td>
                        <td className="p-3">
                          <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                            {p.paymentMethod}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">{p.transactionId || "-"}</td>
                        <td className="p-3 text-muted-foreground">{p.notes || "-"}</td>
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
            <h3 className="text-sm font-semibold">Lodged Complaints & Requests</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Ticket</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Issue Title</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Assigned Staff</th>
                    <th className="p-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant.complaints?.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-muted-foreground">No complaints filed</td>
                    </tr>
                  ) : (
                    tenant.complaints?.map((c: any) => {
                      const color = getComplaintStatusColor(c.status);
                      return (
                        <tr key={c.id} className="hover:bg-accent/30">
                          <td className="p-3 font-mono font-bold text-primary">{c.ticketNumber}</td>
                          <td className="p-3 font-medium">{c.category}</td>
                          <td className="p-3 font-semibold">{c.title}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border">
                              {c.priority}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="p-3 text-muted-foreground">{c.assignedStaff?.name || "Unassigned"}</td>
                          <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: VISITORS */}
        {activeTab === "visitors" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Visitor Logs</h3>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Visitor Name</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Purpose</th>
                    <th className="p-3">Check-In Time</th>
                    <th className="p-3">Check-Out Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {tenant.visitors?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-muted-foreground">No visitor entries</td>
                    </tr>
                  ) : (
                    tenant.visitors?.map((v: any) => (
                      <tr key={v.id} className="hover:bg-accent/30">
                        <td className="p-3 font-semibold">{v.visitorName}</td>
                        <td className="p-3">{v.phone}</td>
                        <td className="p-3 text-muted-foreground">{v.purpose}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(v.checkInTime, "dd MMM yyyy, hh:mm a")}</td>
                        <td className="p-3 text-muted-foreground">
                          {v.checkOutTime ? formatDate(v.checkOutTime, "dd MMM yyyy, hh:mm a") : <Badge variant="warning">Inside</Badge>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: DOCUMENTS */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Uploaded Documents & KYC</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {tenant.documents?.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-3">No documents uploaded</p>
              ) : (
                tenant.documents?.map((d: any) => (
                  <Card key={d.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">{d.title}</span>
                      <Badge variant={d.verificationStatus === "VERIFIED" ? "success" : "warning"}>
                        {d.verificationStatus}
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      Type: {d.documentType} • Uploaded {formatDate(d.createdAt)}
                    </div>
                    {d.verifiedBy && (
                      <div className="text-[10px] text-muted-foreground">Verified by {d.verifiedBy}</div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 6: AGREEMENTS */}
        {activeTab === "agreement" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Lease Agreements</h3>
            {tenant.agreements?.map((a: any) => (
              <Card key={a.id} className="p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-primary">{a.agreementNumber}</span>
                    <h4 className="text-base font-bold text-foreground mt-0.5">PG Tenancy Lease Agreement</h4>
                  </div>
                  <Badge variant={a.status === "ACTIVE" ? "success" : "secondary"}>
                    {a.status}
                  </Badge>
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

                <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                  <p>Rules & Terms applied according to hostel regulations.</p>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 7: HISTORY */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Stay Timeline & Check-In / Check-Out Log</h3>
            <div className="space-y-3">
              {tenant.checkIns?.map((ci: any) => (
                <Card key={ci.id} className="p-4 text-xs space-y-1">
                  <div className="flex items-center justify-between font-bold text-emerald-600">
                    <span>Check-In Recorded</span>
                    <span className="text-muted-foreground font-normal">{formatDate(ci.checkInDate)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Allocated Bed. Rent: {formatCurrency(ci.rent)}, Deposit: {formatCurrency(ci.deposit)}. Note: {ci.notes || "None"}
                  </p>
                </Card>
              ))}

              {tenant.checkOuts?.map((co: any) => (
                <Card key={co.id} className="p-4 text-xs space-y-1 border-rose-500/30 bg-rose-500/5">
                  <div className="flex items-center justify-between font-bold text-rose-600">
                    <span>Check-Out Processed</span>
                    <span className="text-muted-foreground font-normal">{formatDate(co.checkOutDate)}</span>
                  </div>
                  <p className="text-muted-foreground">
                    Reason: {co.reason || "Departure"} • Refundable Settlement: {formatCurrency(co.finalSettlementAmount)}. Note: {co.notes || "None"}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Modal: Check-Out Tenant */}
        <Modal
          isOpen={checkoutModalOpen}
          onClose={() => setCheckoutModalOpen(false)}
          title={`Check Out ${tenant.fullName}`}
          description="Final settlement calculation and automatic bed release"
          maxWidth="lg"
        >
          <form onSubmit={handleProcessCheckout} className="space-y-4 text-xs">
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3 text-amber-800 dark:text-amber-400">
              ⚠️ Checking out will release Bed <strong>{tenant.bed?.bedNumber}</strong> back to <strong>AVAILABLE</strong> status and terminate the active agreement.
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check-Out Date *"
                type="date"
                required
                value={checkoutForm.checkOutDate}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, checkOutDate: e.target.value })}
              />
              <Input
                label="Reason for Leaving"
                value={checkoutForm.reason}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, reason: e.target.value })}
                placeholder="Job switch / Agreement end"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
              <Input
                label="Pending Rent Dues (₹)"
                type="number"
                value={checkoutForm.pendingRentDues}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCheckoutForm((prev) => ({
                    ...prev,
                    pendingRentDues: val,
                    finalSettlementAmount: Math.max(0, prev.refundableDeposit - val - prev.utilityDues - prev.damageCharges),
                  }));
                }}
              />
              <Input
                label="Electricity / Utility Dues (₹)"
                type="number"
                value={checkoutForm.utilityDues}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCheckoutForm((prev) => ({
                    ...prev,
                    utilityDues: val,
                    finalSettlementAmount: Math.max(0, prev.refundableDeposit - prev.pendingRentDues - val - prev.damageCharges),
                  }));
                }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Damage / Repair Charges (₹)"
                type="number"
                value={checkoutForm.damageCharges}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCheckoutForm((prev) => ({
                    ...prev,
                    damageCharges: val,
                    finalSettlementAmount: Math.max(0, prev.refundableDeposit - prev.pendingRentDues - prev.utilityDues - val),
                  }));
                }}
              />
              <Input
                label="Security Deposit (₹)"
                type="number"
                value={checkoutForm.refundableDeposit}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCheckoutForm((prev) => ({
                    ...prev,
                    refundableDeposit: val,
                    finalSettlementAmount: Math.max(0, val - prev.pendingRentDues - prev.utilityDues - prev.damageCharges),
                  }));
                }}
              />
            </div>

            <div className="rounded-xl bg-accent/60 p-4 flex items-center justify-between border border-border">
              <span className="font-semibold text-foreground">Final Refundable Settlement:</span>
              <span className="font-extrabold text-lg text-emerald-600">
                {formatCurrency(checkoutForm.finalSettlementAmount)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Checkout Notes</label>
              <textarea
                rows={2}
                value={checkoutForm.notes}
                onChange={(e) => setCheckoutForm({ ...checkoutForm, notes: e.target.value })}
                placeholder="Key returned, room inspection completed..."
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setCheckoutModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="danger" isLoading={submitting}>
                Confirm & Release Bed
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Record Payment */}
        <Modal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          title={`Record Payment for ${tenant.fullName}`}
          description="Log received rent payment and generate official receipt"
          maxWidth="md"
        >
          <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
            <Input
              label="Payment Amount (₹) *"
              type="number"
              min={1}
              required
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({ ...paymentForm, amount: Number(e.target.value) })}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Payment Date *"
                type="date"
                required
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
              />
              <div className="space-y-1">
                <label className="font-medium text-foreground">Payment Method *</label>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="UPI">UPI (Google Pay / PhonePe)</option>
                  <option value="CASH">Cash</option>
                  <option value="BANK_TRANSFER">Bank NEFT/IMPS</option>
                  <option value="CARD">Credit / Debit Card</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <Input
              label="UPI Ref / Transaction ID"
              value={paymentForm.transactionId}
              onChange={(e) => setPaymentForm({ ...paymentForm, transactionId: e.target.value })}
              placeholder="e.g. UPI4291039821"
            />

            <Input
              label="Payment Notes"
              value={paymentForm.notes}
              onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
              placeholder="September rent settlement"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Payment & Generate Receipt
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Generate Invoice */}
        <Modal
          isOpen={invoiceModalOpen}
          onClose={() => setInvoiceModalOpen(false)}
          title={`Generate Rent Invoice for ${tenant.fullName}`}
          description="Create monthly rent bill with utility and late fees"
          maxWidth="md"
        >
          <form onSubmit={handleGenerateInvoice} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Billing Month (YYYY-MM) *"
                required
                value={invoiceForm.billingMonth}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, billingMonth: e.target.value })}
                placeholder="2026-10"
              />
              <Input
                label="Due Date *"
                type="date"
                required
                value={invoiceForm.dueDate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Base Rent Amount (₹) *"
                type="number"
                min={0}
                required
                value={invoiceForm.rentAmount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, rentAmount: Number(e.target.value) })}
              />
              <Input
                label="Utility Charges (₹)"
                type="number"
                min={0}
                value={invoiceForm.utilityCharges}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, utilityCharges: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Late Fee (₹)"
                type="number"
                min={0}
                value={invoiceForm.lateFee}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, lateFee: Number(e.target.value) })}
              />
              <Input
                label="Discount (₹)"
                type="number"
                min={0}
                value={invoiceForm.discount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, discount: Number(e.target.value) })}
              />
            </div>

            <div className="rounded-xl bg-accent/60 p-4 flex items-center justify-between border border-border">
              <span className="font-semibold text-foreground">Total Invoice Payable:</span>
              <span className="font-extrabold text-lg text-primary">
                {formatCurrency(
                  Math.max(
                    0,
                    invoiceForm.rentAmount +
                      invoiceForm.utilityCharges +
                      invoiceForm.lateFee -
                      invoiceForm.discount
                  )
                )}
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setInvoiceModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Create Invoice
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
