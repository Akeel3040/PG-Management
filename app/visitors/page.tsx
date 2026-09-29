"use client";

import React, { useState, useEffect } from "react";
import {
  UserCheck,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  Calendar,
  Phone,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatDate } from "@/lib/utils";

export default function VisitorsPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    tenantId: "",
    visitorName: "",
    phone: "",
    purpose: "Friend / Family Visit",
    idType: "Aadhaar",
    idNumber: "",
    notes: "",
  });

  const loadVisitors = async () => {
    setLoading(true);
    try {
      let url = `/api/visitors?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      const res = await fetch(url);
      if (res.ok) setVisitors(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, [selectedPropertyId]);

  useEffect(() => {
    async function loadTenants() {
      const propId = selectedPropertyId || properties[0]?.id;
      if (!propId) return;
      try {
        const res = await fetch(`/api/tenants?propertyId=${propId}&status=ACTIVE`);
        if (res.ok) setTenants(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadTenants();
  }, [selectedPropertyId, properties]);

  const handleCreateVisitor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          propertyId: form.propertyId || selectedPropertyId || properties[0]?.id,
        }),
      });

      if (res.ok) {
        setModalOpen(false);
        setForm({
          propertyId: form.propertyId,
          tenantId: "",
          visitorName: "",
          phone: "",
          purpose: "Friend / Family Visit",
          idType: "Aadhaar",
          idNumber: "",
          notes: "",
        });
        loadVisitors();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutVisitor = async (id: string) => {
    try {
      const res = await fetch(`/api/visitors/${id}`, { method: "PUT" });
      if (res.ok) loadVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  const activeVisitors = visitors.filter((v) => !v.checkOutTime).length;

  const filtered = visitors.filter((v) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      v.visitorName.toLowerCase().includes(q) ||
      v.phone.toLowerCase().includes(q) ||
      v.tenant?.fullName?.toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Visitor Entry & Gatepass</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Guest registration, host resident mapping, and check-in/out logs
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Log Visitor Entry
          </Button>
        </div>

        {/* Card for Active Guests */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                  Currently Inside Premises
                </span>
                <div className="text-2xl font-bold text-amber-600 mt-0.5">{activeVisitors} Guests</div>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Total Visitor Logs</span>
                <div className="text-2xl font-bold mt-0.5">{visitors.length}</div>
              </div>
              <UserCheck className="h-6 w-6 text-primary" />
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search visitor name, phone, or resident..."
            className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Visitor Name</th>
                  <th className="p-3.5">Contact Phone</th>
                  <th className="p-3.5">Visiting Resident</th>
                  <th className="p-3.5">Room & Bed</th>
                  <th className="p-3.5">Purpose</th>
                  <th className="p-3.5">Check-In Time</th>
                  <th className="p-3.5">Check-Out Time</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading visitors...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">No visitors logged</td>
                  </tr>
                ) : (
                  filtered.map((v) => (
                    <tr key={v.id} className="hover:bg-accent/40 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground">{v.visitorName}</td>
                      <td className="p-3.5">{v.phone}</td>
                      <td className="p-3.5 font-medium">{v.tenant?.fullName}</td>
                      <td className="p-3.5 text-muted-foreground">
                        Room {v.tenant?.room?.roomNumber || "-"} ({v.tenant?.bed?.bedNumber || "-"})
                      </td>
                      <td className="p-3.5 text-muted-foreground">{v.purpose}</td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(v.checkInTime, "dd MMM, hh:mm a")}</td>
                      <td className="p-3.5">
                        {v.checkOutTime ? (
                          <span className="text-muted-foreground">{formatDate(v.checkOutTime, "dd MMM, hh:mm a")}</span>
                        ) : (
                          <Badge variant="warning">Inside Premises</Badge>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {!v.checkOutTime && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCheckoutVisitor(v.id)}
                            className="text-xs h-7 px-2 text-rose-600 border-rose-500/30 hover:bg-rose-500/10"
                          >
                            Check Out
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Log Visitor */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Log Visitor Entry"
          description="Register guest at security reception"
          maxWidth="md"
        >
          <form onSubmit={handleCreateVisitor} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Visiting Resident *</label>
              <select
                required
                value={form.tenantId}
                onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="">-- Select Resident --</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.fullName} (Room {t.room?.roomNumber || "-"})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Visitor Full Name *"
                required
                value={form.visitorName}
                onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
                placeholder="Guest name"
              />
              <Input
                label="Phone Number *"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 00000"
              />
            </div>

            <Input
              label="Purpose of Visit *"
              required
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              placeholder="e.g. Study / Family / Delivery"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Log Entry
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
