"use client";

import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatDate } from "@/lib/utils";

export default function NoticesPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    propertyId: selectedPropertyId || "",
    title: "",
    content: "",
    priority: "MEDIUM",
    targetAudience: "ALL_TENANTS",
  });

  const loadNotices = async () => {
    setLoading(true);
    try {
      let url = `/api/notices?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      const res = await fetch(url);
      if (res.ok) setNotices(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotices();
    if (selectedPropertyId) {
      setForm((prev) => ({ ...prev, propertyId: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const propId = form.propertyId || selectedPropertyId || (properties[0]?.id ?? "");
      const res = await fetch("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, propertyId: propId }),
      });
      if (res.ok) {
        setModalOpen(false);
        setForm({
          propertyId: propId,
          title: "",
          content: "",
          priority: "MEDIUM",
          targetAudience: "ALL_TENANTS",
        });
        loadNotices();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("Are you sure you want to delete this notice?")) return;
    try {
      const res = await fetch(`/api/notices/${id}`, { method: "DELETE" });
      if (res.ok) loadNotices();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notice & Announcement Board</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Publish hostel announcements, maintenance alerts, and celebration notices
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Publish New Notice
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Loading notices...</div>
          ) : notices.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">No active notices published</div>
          ) : (
            notices.map((n) => (
              <Card key={n.id} className="p-5 space-y-3 hover:border-primary/40 transition-all shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">{n.title}</h3>
                      <Badge
                        variant={
                          n.priority === "URGENT" || n.priority === "HIGH" ? "danger" : "secondary"
                        }
                      >
                        {n.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" /> Published {formatDate(n.publishDate)} •{" "}
                      <span>{n.property?.name ? n.property.name : "All Properties"}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteNotice(n.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete notice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed">{n.content}</p>
              </Card>
            ))
          )}
        </div>

        {/* Modal: Publish Notice */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Publish Announcement"
          description="Broadcast a message to residents"
          maxWidth="md"
        >
          <form onSubmit={handleCreateNotice} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Target Property</label>
              <select
                value={form.propertyId}
                onChange={(e) => setForm({ ...form, propertyId: e.target.value })}
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              >
                <option value="">All Properties (Broadcast)</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Notice Title *"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g. Water Tank Cleaning"
              />
              <div className="space-y-1">
                <label className="font-medium text-foreground">Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">Notice Content *</label>
              <textarea
                required
                rows={4}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Write announcement details..."
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Publish Notice
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
