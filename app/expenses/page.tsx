"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingDown,
  Plus,
  Search,
  Filter,
  Trash2,
  AlertCircle,
  Calendar,
  Building2,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate } from "@/lib/utils";

const CATEGORIES = [
  "ELECTRICITY", "WATER", "INTERNET", "MAINTENANCE", "STAFF_SALARY",
  "CLEANING", "SECURITY", "REPAIRS", "GROCERY", "FURNITURE", "PROPERTY_RENT", "OTHER"
];

export default function ExpensesPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [totalExpense, setTotalExpense] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [search, setSearch] = useState("");

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    category: "MAINTENANCE",
    amount: 1000,
    date: new Date().toISOString().split("T")[0],
    vendor: "",
    description: "",
    notes: "",
  });

  const loadExpenses = async () => {
    setLoading(true);
    try {
      let url = `/api/expenses?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      if (categoryFilter) url += `category=${categoryFilter}&`;
      if (startDate && endDate) url += `startDate=${startDate}&endDate=${endDate}&`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setExpenses(data.expenses || []);
        setTotalExpense(data.totalExpense || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [selectedPropertyId, categoryFilter, startDate, endDate]);

  useEffect(() => {
    if (selectedPropertyId) {
      setForm((prev) => ({ ...prev, propertyId: selectedPropertyId }));
    }
  }, [selectedPropertyId]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          propertyId: form.propertyId || selectedPropertyId || properties[0]?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add expense");
        return;
      }

      setModalOpen(false);
      setForm({
        propertyId: form.propertyId,
        category: "MAINTENANCE",
        amount: 1000,
        date: new Date().toISOString().split("T")[0],
        vendor: "",
        description: "",
        notes: "",
      });
      loadExpenses();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense record?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) loadExpenses();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = expenses.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.description.toLowerCase().includes(q) ||
      e.vendor?.toLowerCase().includes(q) ||
      e.category.toLowerCase().includes(q)
    );
  });

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Expense Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Track vendor payments, utility bills, ration, maintenance, and operational spending
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" /> Add Expense
          </Button>
        </div>

        {/* Total Expense Card */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Total Expenditure
              </span>
              <div className="text-3xl font-extrabold text-amber-600 mt-0.5">
                {formatCurrency(totalExpense)}
              </div>
            </div>
            <div className="text-xs text-muted-foreground sm:text-right">
              <div>Total Logged Vouchers: <strong>{expenses.length}</strong></div>
              <div>Subtracted from revenue to compute Net Operating Income</div>
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
              placeholder="Search description, vendor, or category..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.replace("_", " ")}</option>
            ))}
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

          {(categoryFilter || startDate || endDate || search) && (
            <button
              onClick={() => {
                setCategoryFilter("");
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

        {/* Expenses Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5">Vendor / Payee</th>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Property</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading expenses...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-muted-foreground">
                      <TrendingDown className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      No expenses recorded
                    </td>
                  </tr>
                ) : (
                  filtered.map((e) => (
                    <tr key={e.id} className="hover:bg-accent/40 transition-colors">
                      <td className="p-3.5">
                        <span className="rounded bg-secondary px-2 py-0.5 text-[11px] font-semibold text-secondary-foreground">
                          {e.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 font-semibold text-foreground max-w-xs truncate">
                        {e.description}
                      </td>
                      <td className="p-3.5 text-muted-foreground">{e.vendor || "-"}</td>
                      <td className="p-3.5 text-muted-foreground">{formatDate(e.date)}</td>
                      <td className="p-3.5 font-bold text-amber-600 text-sm">{formatCurrency(e.amount)}</td>
                      <td className="p-3.5 text-muted-foreground">{e.property?.name}</td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleDeleteExpense(e.id)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                          title="Delete expense"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal: Add Expense */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add Expense Voucher"
          description="Record an operational or maintenance expense"
          maxWidth="md"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="font-medium text-foreground">Target Property *</label>
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
              <div className="space-y-1">
                <label className="font-medium text-foreground">Expense Category *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Amount (₹) *"
                type="number"
                min={1}
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Expense Date *"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <Input
                label="Vendor / Payee"
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="e.g. BESCOM / Grocery store"
              />
            </div>

            <Input
              label="Description of Expense *"
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Commercial electricity bill for meter #9921"
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Expense
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
