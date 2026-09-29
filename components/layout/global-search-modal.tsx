"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, Bed, MessageSquareWarning, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/modal";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    tenants: any[];
    rooms: any[];
    complaints: any[];
  }>({ tenants: [], rooms: [], complaints: [] });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open handled by parent
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ tenants: [], rooms: [], complaints: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [tRes, rRes, cRes] = await Promise.all([
          fetch(`/api/tenants?search=${encodeURIComponent(query)}`),
          fetch(`/api/rooms`),
          fetch(`/api/complaints`),
        ]);

        const tenants = tRes.ok ? await tRes.json() : [];
        const allRooms = rRes.ok ? await rRes.json() : [];
        const allComplaints = cRes.ok ? await cRes.json() : [];

        const filteredRooms = allRooms
          .filter((r: any) => r.roomNumber.toLowerCase().includes(query.toLowerCase()))
          .slice(0, 5);

        const filteredComplaints = allComplaints
          .filter(
            (c: any) =>
              c.title.toLowerCase().includes(query.toLowerCase()) ||
              c.ticketNumber.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 5);

        setResults({
          tenants: tenants.slice(0, 5),
          rooms: filteredRooms,
          complaints: filteredComplaints,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const navigateTo = (url: string) => {
    onClose();
    router.push(url);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="xl">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenants by name/phone, room numbers, tickets..."
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
          />
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-border/60">
          {loading && <p className="py-6 text-center text-xs text-muted-foreground">Searching database...</p>}

          {!loading && query && results.tenants.length === 0 && results.rooms.length === 0 && results.complaints.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">No matching records found for "{query}"</p>
          )}

          {/* Tenants */}
          {results.tenants.length > 0 && (
            <div className="py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                Tenants
              </span>
              <div className="mt-1 space-y-1">
                {results.tenants.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => navigateTo(`/tenants/${t.id}`)}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <User className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-semibold">{t.fullName}</div>
                        <div className="text-[11px] text-muted-foreground">{t.phone} • Room {t.room?.roomNumber || "-"}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rooms */}
          {results.rooms.length > 0 && (
            <div className="py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                Rooms
              </span>
              <div className="mt-1 space-y-1">
                {results.rooms.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => navigateTo(`/rooms`)}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Bed className="h-4 w-4 text-emerald-500" />
                      <div>
                        <div className="font-semibold">Room {r.roomNumber}</div>
                        <div className="text-[11px] text-muted-foreground">{r.roomType} • {r.numberOfBeds} Beds</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Complaints */}
          {results.complaints.length > 0 && (
            <div className="py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-2">
                Complaints
              </span>
              <div className="mt-1 space-y-1">
                {results.complaints.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => navigateTo(`/complaints`)}
                    className="flex items-center justify-between rounded-lg p-2 hover:bg-accent cursor-pointer transition-colors text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquareWarning className="h-4 w-4 text-amber-500" />
                      <div>
                        <div className="font-semibold">{c.title}</div>
                        <div className="text-[11px] text-muted-foreground">{c.ticketNumber} • {c.status}</div>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
