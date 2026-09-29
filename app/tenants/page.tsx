"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Phone,
  Mail,
  Bed,
  CreditCard,
  ArrowRight,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useProperty } from "@/components/property-context";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function TenantsPage() {
  const { selectedPropertyId } = useProperty();
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTenants = async () => {
    setLoading(true);
    try {
      let url = `/api/tenants?`;
      if (selectedPropertyId) url += `propertyId=${selectedPropertyId}&`;
      if (statusFilter) url += `status=${statusFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await fetch(url);
      if (res.ok) {
        setTenants(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [selectedPropertyId, statusFilter, search]);

  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const noticeCount = tenants.filter((t) => t.status === "NOTICE_PERIOD").length;
  const checkedOutCount = tenants.filter((t) => t.status === "CHECKED_OUT").length;

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenant Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage residents, onboarding, bed assignments, profiles, and checkout
            </p>
          </div>
          <Link href="/tenants/new">
            <Button size="sm">
              <UserPlus className="h-4 w-4 mr-1.5" /> Onboard New Tenant
            </Button>
          </Link>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-border bg-card p-3.5">
            <span className="text-xs text-muted-foreground">Total Registered</span>
            <div className="text-2xl font-bold mt-1">{tenants.length}</div>
          </div>
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Active Residents</span>
            <div className="text-2xl font-bold text-emerald-600 mt-1">{activeCount}</div>
          </div>
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Notice Period</span>
            <div className="text-2xl font-bold text-amber-600 mt-1">{noticeCount}</div>
          </div>
          <div className="rounded-xl border border-slate-500/20 bg-slate-500/5 p-3.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">Checked Out</span>
            <div className="text-2xl font-bold text-muted-foreground mt-1">{checkedOutCount}</div>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, phone, email, or room..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="NOTICE_PERIOD">Notice Period</option>
            <option value="CHECKED_OUT">Checked Out</option>
          </select>
        </div>

        {/* Tenants Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                <tr>
                  <th className="p-3.5">Tenant Details</th>
                  <th className="p-3.5">Room & Bed</th>
                  <th className="p-3.5">Property</th>
                  <th className="p-3.5">Joining Date</th>
                  <th className="p-3.5">Monthly Rent</th>
                  <th className="p-3.5">Pending Dues</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Loading tenants...
                    </td>
                  </tr>
                ) : tenants.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-muted-foreground">
                      <Users className="mx-auto h-10 w-10 text-muted-foreground/40 mb-2" />
                      No tenants found matching your query
                    </td>
                  </tr>
                ) : (
                  tenants.map((t) => (
                    <tr key={t.id} className="hover:bg-accent/40 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                            {t.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground text-sm">{t.fullName}</div>
                            <div className="text-[11px] text-muted-foreground">{t.phone}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        {t.room && t.bed ? (
                          <div className="flex items-center gap-1.5 font-medium">
                            <span className="rounded bg-secondary px-2 py-0.5 text-[11px]">
                              Room {t.room.roomNumber}
                            </span>
                            <span className="rounded bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-bold">
                              {t.bed.bedNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">No Bed Assigned</span>
                        )}
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        {t.property?.name}
                      </td>

                      <td className="p-3.5 text-muted-foreground">
                        {formatDate(t.joiningDate)}
                      </td>

                      <td className="p-3.5 font-semibold text-foreground">
                        {formatCurrency(t.monthlyRent)}
                      </td>

                      <td className="p-3.5">
                        {t.pendingDues > 0 ? (
                          <span className="font-bold text-rose-600 dark:text-rose-400">
                            {formatCurrency(t.pendingDues)}
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-medium">Clear ✓</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <Badge
                          variant={
                            t.status === "ACTIVE"
                              ? "success"
                              : t.status === "NOTICE_PERIOD"
                              ? "warning"
                              : "secondary"
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>

                      <td className="p-3.5 text-right">
                        <Link href={`/tenants/${t.id}`}>
                          <Button variant="outline" size="sm" className="text-xs">
                            Profile <ArrowRight className="h-3 w-3 ml-1" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
}
