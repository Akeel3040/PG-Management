"use client";

import React, { useState, useEffect } from "react";
import {
  Zap,
  Plus,
  Search,
  Calendar,
  Layers,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency } from "@/lib/utils";

export default function UtilitiesPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    utilityType: "ELECTRICITY",
    billingMonth: new Date().toISOString().slice(0, 7),
    previousReading: 1200,
    currentReading: 1450,
    perUnitRate: 9.5,
    isShared: false,
  });

  const loadReadings = async () => {
    setLoading(true);
    try {
      let url = `/api/utilities?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      const res = await fetch(url);
      if (res.ok) setReadings(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReadings();
  }, [selectedPropertyId]);

  const handleCreateReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          propertyId: form.propertyId || selectedPropertyId || properties[0]?.id,
        }),
      });
      if (res.ok) {
        setModalOpen(false);
        loadReadings();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const units = Math.max(0, form.currentReading - form.previousReading);
  const total = Math.round(units * form.perUnitRate);

  return (
    <Shell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Electricity & Utility Tracker</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Meter reading logger, units consumed calculations, and per-unit rate billing
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Log Meter Reading
          </Button>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Property</th>
                  <th className="p-3.5">Utility Type</th>
                  <th className="p-3.5">Month</th>
                  <th className="p-3.5">Prev Reading</th>
                  <th className="p-3.5">Current Reading</th>
                  <th className="p-3.5">Units Consumed</th>
                  <th className="p-3.5">Rate / Unit</th>
                  <th className="p-3.5 text-right">Total Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">Loading utility readings...</td>
                  </tr>
                ) : readings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">No utility meter readings recorded</td>
                  </tr>
                ) : (
                  readings.map((r) => (
                    <tr key={r.id} className="hover:bg-accent/40 transition-colors">
                      <td className="p-3.5 font-semibold text-foreground">{r.property?.name}</td>
                      <td className="p-3.5">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold">
                          {r.utilityType}
                        </span>
                      </td>
                      <td className="p-3.5 font-medium">{r.billingMonth}</td>
                      <td className="p-3.5 text-muted-foreground">{r.previousReading}</td>
                      <td className="p-3.5 text-muted-foreground">{r.currentReading}</td>
                      <td className="p-3.5 font-bold text-foreground">{r.unitsConsumed} Units</td>
                      <td className="p-3.5 text-muted-foreground">₹{r.perUnitRate}/unit</td>
                      <td className="p-3.5 text-right font-bold text-emerald-600 text-sm">
                        {formatCurrency(r.totalAmount)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Log Reading */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Log Utility Meter Reading"
          description="Calculate bill based on previous and current meter readings"
          maxWidth="md"
        >
          <form onSubmit={handleCreateReading} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
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

              <Input
                label="Billing Month (YYYY-MM) *"
                value={form.billingMonth}
                onChange={(e) => setForm({ ...form, billingMonth: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Previous Reading *"
                type="number"
                min={0}
                required
                value={form.previousReading}
                onChange={(e) => setForm({ ...form, previousReading: Number(e.target.value) })}
              />
              <Input
                label="Current Reading *"
                type="number"
                min={0}
                required
                value={form.currentReading}
                onChange={(e) => setForm({ ...form, currentReading: Number(e.target.value) })}
              />
            </div>

            <Input
              label="Per-Unit Rate (₹) *"
              type="number"
              step="0.1"
              min={0}
              required
              value={form.perUnitRate}
              onChange={(e) => setForm({ ...form, perUnitRate: Number(e.target.value) })}
            />

            <div className="rounded-xl bg-accent/60 p-3 flex items-center justify-between border border-border">
              <div>
                <span className="text-muted-foreground">Units Consumed:</span>
                <div className="font-bold text-foreground text-sm">{units} Units</div>
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Calculated Bill:</span>
                <div className="font-extrabold text-base text-emerald-600">{formatCurrency(total)}</div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Reading
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
