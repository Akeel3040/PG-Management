"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Trash2,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const ROLES = ["MANAGER", "ACCOUNTANT", "SECURITY", "CLEANER", "MAINTENANCE", "COOK", "OTHER"];

export default function StaffPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    name: "",
    phone: "",
    email: "",
    role: "MAINTENANCE",
    salary: 20000,
    joiningDate: new Date().toISOString().split("T")[0],
    address: "",
    emergencyContact: "",
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      let url = `/api/staff?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      const res = await fetch(url);
      if (res.ok) setStaff(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, [selectedPropertyId]);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff", {
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
          name: "",
          phone: "",
          email: "",
          role: "MAINTENANCE",
          salary: 20000,
          joiningDate: new Date().toISOString().split("T")[0],
          address: "",
          emergencyContact: "",
        });
        loadStaff();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff record?")) return;
    try {
      const res = await fetch(`/api/staff/${id}`, { method: "DELETE" });
      if (res.ok) loadStaff();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Staff & Employee Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Housekeeping, cooks, security personnel, maintenance engineers, and managers
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Staff Member
          </Button>
        </div>

        {/* Staff Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {loading ? (
            <div className="col-span-3 py-16 text-center text-xs text-muted-foreground">Loading staff members...</div>
          ) : staff.length === 0 ? (
            <div className="col-span-3 py-16 text-center text-xs text-muted-foreground">No staff members assigned</div>
          ) : (
            staff.map((s) => (
              <Card key={s.id} className="p-5 space-y-4 hover:border-primary/40 transition-all shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground">{s.name}</h3>
                      <span className="text-[11px] text-muted-foreground">{s.property?.name}</span>
                    </div>
                  </div>
                  <Badge variant="outline">{s.role}</Badge>
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-foreground" />
                    <span>{s.phone}</span>
                  </div>
                  {s.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-foreground" />
                      <span>{s.email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-foreground" />
                    <span>Joined: {formatDate(s.joiningDate)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Monthly Salary:</span>
                    <div className="font-bold text-foreground">{formatCurrency(s.salary)}</div>
                  </div>
                  <button
                    onClick={() => handleDeleteStaff(s.id)}
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors"
                    title="Remove staff"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Modal: Add Staff */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Staff Member"
          description="Register a new employee into property operations"
          maxWidth="md"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Property *</label>
              <select
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Full Name *"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ramesh Yadav"
              />
              <div className="space-y-1">
                <label className="font-medium text-foreground">Designation / Role *</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Phone *"
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Monthly Salary (₹)"
                type="number"
                min={0}
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: Number(e.target.value) })}
              />
            </div>

            <Input
              label="Email Address (Optional)"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Staff
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
