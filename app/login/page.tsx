"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, KeyRound, Mail, AlertCircle, ArrowRight, ShieldCheck, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";

const DEMO_ACCOUNTS = [
  { role: "Owner", email: "owner@pgmanagement.com", desc: "Full PG access & finances" },
  { role: "Manager", email: "manager@pgmanagement.com", desc: "Tenants, beds, complaints" },
  { role: "Accountant", email: "accountant@pgmanagement.com", desc: "Rent, bills & expenses" },
  { role: "Staff", email: "staff@pgmanagement.com", desc: "Maintenance & daily ops" },
  { role: "Tenant", email: "tenant@pgmanagement.com", desc: "My room, dues & tickets" },
  { role: "Admin", email: "admin@pgmanagement.com", desc: "Super Admin system control" },
];

export default function LoginPage() {
  const [email, setEmail] = useState("owner@pgmanagement.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Login failed");
        return;
      }

      await refreshUser();
      if (data.user?.role === "TENANT") {
        router.push("/portal");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("An unexpected network error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword("password123");
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left hero banner */}
      <div className="hidden md:flex md:w-1/2 bg-slate-900 text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">PG MANAGEMENT SYSTEM</h1>
            <p className="text-xs text-slate-400">Enterprise Hostel & Co-Living Cloud</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6 my-auto max-w-lg">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            Streamline properties, rooms, beds, rent, and tenant operations.
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Real-time occupancy tracking, automatic rent invoices, partial payments, complaint resolution, visitor logs, and multi-property centralized control.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="h-3 w-3" />
              </div>
              <span>Multi-Property Support</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="h-3 w-3" />
              </div>
              <span>Visual Room / Bed Matrix</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="h-3 w-3" />
              </div>
              <span>Automated Invoicing & GST</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Check className="h-3 w-3" />
              </div>
              <span>Dedicated Tenant Portal</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>Production Ready • Next.js & PostgreSQL</span>
          <span>Version 1.0.0</span>
        </div>
      </div>

      {/* Right Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-1.5 text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight">Sign in to your account</h2>
            <p className="text-xs text-muted-foreground">
              Enter your registered credentials or select a demo role below
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive font-medium animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-foreground">Password</label>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={loading}>
              Sign In <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          {/* Quick Demo Switcher */}
          <div className="border-t border-border pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                One-Click Demo Profiles
              </span>
              <span className="text-[11px] text-muted-foreground">(Password: password123)</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => selectDemoAccount(acc.email)}
                  className={`flex flex-col items-start rounded-lg border p-2 text-left text-xs transition-all hover:border-primary/50 hover:bg-accent ${
                    email === acc.email ? "border-primary bg-primary/5 font-semibold" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-foreground">{acc.role}</span>
                    {email === acc.email && <div className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate w-full mt-0.5">{acc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
