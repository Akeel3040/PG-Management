"use client";

import React, { useState, useEffect } from "react";
import {
  Menu,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  Building2,
  Check,
} from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { useTheme } from "@/components/theme-provider";
import { useProperty } from "@/components/property-context";
import { formatDate } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  onSearchClick: () => void;
}

export function Header({ onMenuClick, onSearchClick }: HeaderProps) {
  const { user, unreadCount, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { selectedPropertyId, properties } = useProperty();

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);

  useEffect(() => {
    async function loadNotifications() {
      if (showNotifications) {
        try {
          const res = await fetch("/api/notifications");
          if (res.ok) {
            const data = await res.json();
            setNotifications(data.notifications || []);
          }
        } catch (err) {
          console.error("Failed to load notifications", err);
        }
      }
    }
    loadNotifications();
  }, [showNotifications]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6">
      {/* Left side: Mobile menu toggle + property badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {selectedProperty ? (
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground shadow-xs">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            <span>{selectedProperty.name}</span>
            <span className="rounded bg-primary/10 px-1.5 py-0.2 text-[10px] font-bold text-primary">
              {selectedProperty.code}
            </span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Building2 className="h-3.5 w-3.5" />
            <span>All Properties</span>
          </div>
        )}
      </div>

      {/* Right side: Search, Notifications, Theme, User */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search trigger */}
        <button
          onClick={onSearchClick}
          className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-foreground shadow-xs"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search tenants, rooms, bills...</span>
          <kbd className="hidden sm:inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-border bg-card p-4 shadow-xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <span className="text-sm font-semibold">Notifications</span>
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Check className="h-3 w-3" /> Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-border/50 py-1">
                {notifications.length === 0 ? (
                  <p className="py-6 text-center text-xs text-muted-foreground">No new notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="py-2.5 text-xs">
                      <div className="flex items-center justify-between font-semibold text-foreground">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {formatDate(n.createdAt, "dd MMM")}
                        </span>
                      </div>
                      <p className="mt-0.5 text-muted-foreground">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dark Mode toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors shadow-xs"
          title="Logout"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
}
