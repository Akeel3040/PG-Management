"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Building2,
  Clock,
  Save,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/tabs";
import { useProperty } from "@/components/property-context";
import { formatDate } from "@/lib/utils";

export default function SettingsPage() {
  const { selectedPropertyId } = useProperty();
  const [activeTab, setActiveTab] = useState("general");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [settings, setSettings] = useState({
    SYSTEM_CURRENCY: "INR",
    RENT_DUE_DAY: "5",
    LATE_FEE_PER_DAY: "100",
    DEFAULT_NOTICE_PERIOD: "30",
    GRACE_PERIOD_DAYS: "3",
    GATE_CLOSING_TIME: "11:00 PM",
  });

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch(`/api/settings`);
        if (res.ok) {
          const data = await res.json();
          setSettings((prev) => ({ ...prev, ...data }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function loadLogs() {
      if (activeTab === "audit") {
        setLoadingLogs(true);
        try {
          const res = await fetch("/api/activity-logs");
          if (res.ok) setActivityLogs(await res.json());
        } catch (err) {
          console.error(err);
        } finally {
          setLoadingLogs(false);
        }
      }
    }
    loadLogs();
  }, [activeTab]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId || null,
          settings,
        }),
      });

      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: "general", label: "Rent & Billing Rules", icon: <Settings className="h-4 w-4" /> },
    { id: "audit", label: "System Audit Trail", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <Shell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System & Property Settings</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure financial rules, late fee policies, currency, and review security audit logs
          </p>
        </div>

        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* TAB 1: GENERAL SETTINGS */}
        {activeTab === "general" && (
          <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
            {savedSuccess && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Settings saved successfully to database!</span>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rent Due & Invoicing Automation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Rent Due Day of Month *"
                    type="number"
                    min={1}
                    max={28}
                    required
                    value={settings.RENT_DUE_DAY}
                    onChange={(e) => setSettings({ ...settings, RENT_DUE_DAY: e.target.value })}
                  />
                  <Input
                    label="Grace Period (Days)"
                    type="number"
                    min={0}
                    value={settings.GRACE_PERIOD_DAYS}
                    onChange={(e) => setSettings({ ...settings, GRACE_PERIOD_DAYS: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Late Fee per Day (₹)"
                    type="number"
                    min={0}
                    value={settings.LATE_FEE_PER_DAY}
                    onChange={(e) => setSettings({ ...settings, LATE_FEE_PER_DAY: e.target.value })}
                  />
                  <Input
                    label="Standard Notice Period (Days)"
                    type="number"
                    min={0}
                    value={settings.DEFAULT_NOTICE_PERIOD}
                    onChange={(e) => setSettings({ ...settings, DEFAULT_NOTICE_PERIOD: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-medium text-foreground">Base Currency</label>
                    <select
                      value={settings.SYSTEM_CURRENCY}
                      onChange={(e) => setSettings({ ...settings, SYSTEM_CURRENCY: e.target.value })}
                      className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                    >
                      <option value="INR">INR (₹ - Indian Rupee)</option>
                      <option value="USD">USD ($ - US Dollar)</option>
                    </select>
                  </div>

                  <Input
                    label="Hostel Gate Closing Time"
                    value={settings.GATE_CLOSING_TIME}
                    onChange={(e) => setSettings({ ...settings, GATE_CLOSING_TIME: e.target.value })}
                    placeholder="11:00 PM"
                  />
                </div>

                <div className="pt-3 border-t border-border flex justify-end">
                  <Button type="submit" isLoading={saving}>
                    <Save className="h-4 w-4 mr-1.5" /> Save Configuration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </form>
        )}

        {/* TAB 2: AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Security & Operational Audit Log Trail</h3>
              <span className="text-xs text-muted-foreground">{activityLogs.length} events logged</span>
            </div>

            <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Entity</th>
                      <th className="p-3.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {loadingLogs ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">Loading audit trail...</td>
                      </tr>
                    ) : activityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-muted-foreground">No audit logs available</td>
                      </tr>
                    ) : (
                      activityLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                          <td className="p-3.5 text-muted-foreground whitespace-nowrap">
                            {formatDate(log.createdAt, "dd MMM yyyy, hh:mm a")}
                          </td>
                          <td className="p-3.5 font-semibold text-foreground">
                            {log.user?.name || "System"}
                          </td>
                          <td className="p-3.5">
                            <Badge variant="outline">{log.user?.role || "SYSTEM"}</Badge>
                          </td>
                          <td className="p-3.5 font-mono text-[11px] font-bold text-primary">
                            {log.action}
                          </td>
                          <td className="p-3.5 text-muted-foreground">{log.entity}</td>
                          <td className="p-3.5 text-foreground max-w-md truncate">{log.details}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
