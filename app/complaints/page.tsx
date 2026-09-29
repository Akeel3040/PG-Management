"use client";

import React, { useState, useEffect } from "react";
import {
  MessageSquareWarning,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Wrench,
  AlertCircle,
  User,
  Building2,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { useAuth } from "@/components/auth-context";
import { formatDate, getComplaintStatusColor } from "@/lib/utils";

const CATEGORIES = [
  "ELECTRICITY", "PLUMBING", "INTERNET", "CLEANING", "FOOD", "ROOM", "SECURITY", "MAINTENANCE", "OTHER"
];

export default function ComplaintsPage() {
  const { selectedPropertyId, properties } = useProperty();
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");

  // Modals
  const [newComplaintModal, setNewComplaintModal] = useState(false);
  const [editModal, setEditModal] = useState<any>(null);

  // Forms
  const [form, setForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    category: "MAINTENANCE",
    title: "",
    description: "",
    priority: "MEDIUM",
  });

  const [editForm, setEditForm] = useState({
    status: "OPEN",
    priority: "MEDIUM",
    assignedStaffId: "",
    resolutionNotes: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      let url = `/api/complaints?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (priorityFilter) url += `priority=${priorityFilter}&`;

      const res = await fetch(url);
      if (res.ok) setComplaints(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, [selectedPropertyId, statusFilter, priorityFilter]);

  useEffect(() => {
    async function loadStaff() {
      const propId = selectedPropertyId || properties[0]?.id;
      if (!propId) return;
      try {
        const res = await fetch(`/api/staff?propertyId=${propId}`);
        if (res.ok) setStaffList(await res.json());
      } catch (err) {
        console.error(err);
      }
    }
    loadStaff();
  }, [selectedPropertyId, properties]);

  const handleCreateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          propertyId: form.propertyId || selectedPropertyId || properties[0]?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create complaint");
        return;
      }

      setNewComplaintModal(false);
      setForm({
        propertyId: form.propertyId,
        category: "MAINTENANCE",
        title: "",
        description: "",
        priority: "MEDIUM",
      });
      loadComplaints();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/complaints/${editModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (res.ok) {
        setEditModal(null);
        loadComplaints();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (c: any) => {
    setEditModal(c);
    setEditForm({
      status: c.status,
      priority: c.priority,
      assignedStaffId: c.assignedStaffId || "",
      resolutionNotes: c.resolutionNotes || "",
    });
  };

  const filtered = complaints.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.ticketNumber.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.tenant?.fullName?.toLowerCase().includes(q)
    );
  });

  const openCount = complaints.filter((c) => c.status === "OPEN").length;
  const inProgressCount = complaints.filter((c) => c.status === "IN_PROGRESS" || c.status === "ASSIGNED").length;
  const resolvedCount = complaints.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Maintenance & Complaints</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Service requests, work orders, staff assignments, and resolution tracking
            </p>
          </div>
          <Button onClick={() => setNewComplaintModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> File New Request
          </Button>
        </div>

        {/* Status Metrics Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Open Tickets</span>
                <div className="text-2xl font-bold text-amber-600 mt-0.5">{openCount}</div>
              </div>
              <Clock className="h-6 w-6 text-amber-500" />
            </CardContent>
          </Card>

          <Card className="border-sky-500/20 bg-sky-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-sky-700 dark:text-sky-400">In Progress / Assigned</span>
                <div className="text-2xl font-bold text-sky-600 mt-0.5">{inProgressCount}</div>
              </div>
              <Wrench className="h-6 w-6 text-sky-500" />
            </CardContent>
          </Card>

          <Card className="border-emerald-500/20 bg-emerald-500/5">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Resolved & Closed</span>
                <div className="text-2xl font-bold text-emerald-600 mt-0.5">{resolvedCount}</div>
              </div>
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
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
              placeholder="Search ticket #, title, or tenant..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          {(statusFilter || priorityFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter("");
                setPriorityFilter("");
                setSearch("");
              }}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Complaints Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Ticket #</th>
                  <th className="p-3.5">Issue Title</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Resident</th>
                  <th className="p-3.5">Room & Bed</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Assigned Staff</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-muted-foreground">Loading complaints...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-12 text-center text-muted-foreground">
                      <MessageSquareWarning className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      No complaints found
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const color = getComplaintStatusColor(c.status);
                    return (
                      <tr key={c.id} className="hover:bg-accent/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-primary">{c.ticketNumber}</td>
                        <td className="p-3.5 font-semibold text-foreground max-w-xs truncate">
                          {c.title}
                          <div className="text-[11px] text-muted-foreground font-normal truncate">{c.description}</div>
                        </td>
                        <td className="p-3.5">
                          <span className="rounded bg-secondary px-2 py-0.5 text-[11px]">
                            {c.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-medium">{c.tenant?.fullName}</td>
                        <td className="p-3.5 text-muted-foreground">
                          Room {c.tenant?.room?.roomNumber || "-"} ({c.tenant?.bed?.bedNumber || "-"})
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            c.priority === "URGENT"
                              ? "bg-rose-500/15 text-rose-600 border-rose-500/30"
                              : c.priority === "HIGH"
                              ? "bg-amber-500/15 text-amber-600 border-amber-500/30"
                              : "border-border text-muted-foreground"
                          }`}>
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${color}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{c.assignedStaff?.name || "Unassigned"}</td>
                        <td className="p-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(c)}
                            className="text-xs h-7 px-2"
                          >
                            Update
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: New Complaint */}
        <Modal
          isOpen={newComplaintModal}
          onClose={() => setNewComplaintModal(false)}
          title="File Maintenance / Support Request"
          description="Submit a complaint or maintenance issue"
          maxWidth="md"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateComplaint} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Priority *</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent (Immediate action)</option>
                </select>
              </div>
            </div>

            <Input
              label="Issue Summary Title *"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Geyser not working in Room 101"
            />

            <div className="space-y-1">
              <label className="font-medium text-foreground">Detailed Description *</label>
              <textarea
                required
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Explain the problem in detail..."
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setNewComplaintModal(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Submit Request
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Update Complaint / Assign / Resolve */}
        <Modal
          isOpen={!!editModal}
          onClose={() => setEditModal(null)}
          title={`Update Ticket: ${editModal?.ticketNumber}`}
          description={editModal?.title}
          maxWidth="md"
        >
          <form onSubmit={handleUpdateComplaint} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Status *</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="OPEN">Open</option>
                  <option value="ASSIGNED">Assigned</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Assign Staff Member</label>
                <select
                  value={editForm.assignedStaffId}
                  onChange={(e) => setEditForm({ ...editForm, assignedStaffId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Unassigned --</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Resolution Notes & Actions Taken</label>
              <textarea
                rows={3}
                value={editForm.resolutionNotes}
                onChange={(e) => setEditForm({ ...editForm, resolutionNotes: e.target.value })}
                placeholder="Details of parts replaced, repairs done, or explanation..."
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setEditModal(null)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Changes
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
