"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  LayoutDashboard,
  Bed,
  Users,
  CreditCard,
  Receipt,
  TrendingDown,
  MessageSquareWarning,
  UserCheck,
  Briefcase,
  Bell,
  Zap,
  FileText,
  BarChart3,
  Settings,
  ChevronDown,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-context";
import { useProperty } from "@/components/property-context";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { selectedPropertyId, setSelectedPropertyId, properties } = useProperty();

  const navigationItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "ACCOUNTANT", "STAFF"] },
    { label: "Properties", href: "/properties", icon: Building2, roles: ["SUPER_ADMIN", "OWNER"] },
    { label: "Rooms & Beds", href: "/rooms", icon: Bed, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"] },
    { label: "Tenants", href: "/tenants", icon: Users, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "ACCOUNTANT"] },
    { label: "Rent & Invoices", href: "/rent", icon: Receipt, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "ACCOUNTANT"] },
    { label: "Payments", href: "/payments", icon: CreditCard, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "ACCOUNTANT"] },
    { label: "Expenses", href: "/expenses", icon: TrendingDown, roles: ["SUPER_ADMIN", "OWNER", "ACCOUNTANT"] },
    { label: "Complaints", href: "/complaints", icon: MessageSquareWarning, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"] },
    { label: "Visitors", href: "/visitors", icon: UserCheck, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"] },
    { label: "Staff", href: "/staff", icon: Briefcase, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
    { label: "Notices", href: "/notices", icon: Bell, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "STAFF"] },
    { label: "Utilities", href: "/utilities", icon: Zap, roles: ["SUPER_ADMIN", "OWNER", "MANAGER", "ACCOUNTANT"] },
    { label: "Documents", href: "/documents", icon: FileText, roles: ["SUPER_ADMIN", "OWNER", "MANAGER"] },
    { label: "Reports", href: "/reports", icon: BarChart3, roles: ["SUPER_ADMIN", "OWNER", "ACCOUNTANT"] },
    { label: "Settings", href: "/settings", icon: Settings, roles: ["SUPER_ADMIN", "OWNER"] },
  ];

  const filteredNav = navigationItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Brand Logo & Property Switcher */}
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <Link href="/dashboard" className="flex items-center gap-2.5 font-bold text-base tracking-tight">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="leading-tight">PG SAAS</span>
              <span className="text-[10px] font-normal text-muted-foreground uppercase tracking-wider">
                Management
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Property Selector for Multi-PG */}
        {user?.role !== "TENANT" && properties.length > 0 && (
          <div className="border-b border-border p-3">
            <label className="block text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
              Active Property
            </label>
            <div className="relative">
              <select
                value={selectedPropertyId || ""}
                onChange={(e) => setSelectedPropertyId(e.target.value || null)}
                className="w-full appearance-none rounded-lg border border-input bg-background px-3 py-1.5 pr-8 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"
              >
                <option value="">All Properties (Consolidated)</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.code})
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>
        )}

        {/* Nav list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* User Card */}
        {user && (
          <div className="border-t border-border p-3">
            <div className="flex items-center gap-3 rounded-lg bg-accent/50 p-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="truncate text-xs font-semibold">{user.name}</span>
                <span className="text-[10px] text-muted-foreground font-medium">{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
