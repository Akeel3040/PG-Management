"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bed,
  Building2,
  Plus,
  Filter,
  User,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Wrench,
  Layers,
  ChevronDown,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency, getBedStatusColor } from "@/lib/utils";

export default function RoomsPage() {
  const { selectedPropertyId, properties } = useProperty();
  const [rooms, setRooms] = useState<any[]>([]);
  const [floors, setFloors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFloor, setSelectedFloor] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Modals
  const [addRoomOpen, setAddRoomOpen] = useState(false);
  const [addBedOpen, setAddBedOpen] = useState(false);
  const [selectedBedForEdit, setSelectedBedForEdit] = useState<any>(null);

  // Forms
  const [roomForm, setRoomForm] = useState({
    propertyId: "",
    floorId: "",
    roomNumber: "",
    roomType: "DOUBLE_SHARING",
    capacity: 2,
    numberOfBeds: 2,
    hasAc: false,
    hasAttachedBathroom: true,
    baseRent: 10000,
    securityDeposit: 20000,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const propId = selectedPropertyId || (properties[0]?.id ?? "");
      if (!propId) return;

      const [rRes, fRes] = await Promise.all([
        fetch(`/api/rooms?propertyId=${propId}`),
        fetch(`/api/floors?propertyId=${propId}`),
      ]);

      if (rRes.ok) setRooms(await rRes.json());
      if (fRes.ok) setFloors(await fRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    if (selectedPropertyId) {
      setRoomForm((prev) => ({ ...prev, propertyId: selectedPropertyId }));
    }
  }, [selectedPropertyId, properties]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const propId = roomForm.propertyId || selectedPropertyId || properties[0]?.id;
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...roomForm, propertyId: propId }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create room");
        return;
      }

      setAddRoomOpen(false);
      setRoomForm({
        propertyId: propId,
        floorId: "",
        roomNumber: "",
        roomType: "DOUBLE_SHARING",
        capacity: 2,
        numberOfBeds: 2,
        hasAc: false,
        hasAttachedBathroom: true,
        baseRent: 10000,
        securityDeposit: 20000,
      });
      loadData();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateBedStatus = async (newStatus: string) => {
    if (!selectedBedForEdit) return;
    try {
      const res = await fetch(`/api/beds/${selectedBedForEdit.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setSelectedBedForEdit(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered rooms
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloor && r.floorId !== selectedFloor) return false;
    if (selectedType && r.roomType !== selectedType) return false;
    if (selectedStatus) {
      const hasMatchingBed = r.beds.some((b: any) => b.status === selectedStatus);
      if (!hasMatchingBed) return false;
    }
    return true;
  });

  // Calculate totals
  const allBeds = rooms.flatMap((r) => r.beds);
  const totalBeds = allBeds.length;
  const availableBeds = allBeds.filter((b) => b.status === "AVAILABLE").length;
  const occupiedBeds = allBeds.filter((b) => b.status === "OCCUPIED").length;
  const reservedBeds = allBeds.filter((b) => b.status === "RESERVED").length;
  const maintenanceBeds = allBeds.filter((b) => b.status === "MAINTENANCE").length;

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Room & Bed Occupancy Matrix</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Live visual layout of floors, room capacities, and bed status
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setAddRoomOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Add Room & Beds
            </Button>
          </div>
        </div>

        {/* Status Legend & Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white font-bold text-xs">
              {availableBeds}
            </div>
            <div>
              <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">Available Beds</div>
              <div className="text-[11px] text-muted-foreground">Ready for booking</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500 text-white font-bold text-xs">
              {occupiedBeds}
            </div>
            <div>
              <div className="text-xs font-semibold text-rose-700 dark:text-rose-400">Occupied Beds</div>
              <div className="text-[11px] text-muted-foreground">Active tenants</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs">
              {reservedBeds}
            </div>
            <div>
              <div className="text-xs font-semibold text-amber-700 dark:text-amber-400">Reserved Beds</div>
              <div className="text-[11px] text-muted-foreground">Upcoming arrivals</div>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-500/20 bg-slate-500/5 p-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-500 text-white font-bold text-xs">
              {maintenanceBeds}
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-400">Under Maintenance</div>
              <div className="text-[11px] text-muted-foreground">Repairs / painting</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap bg-card p-3 rounded-xl border border-border">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" /> Filter by:
          </div>

          {/* Floor filter */}
          <select
            value={selectedFloor}
            onChange={(e) => setSelectedFloor(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Floors</option>
            {floors.map((f) => (
              <option key={f.id} value={f.id}>{f.floorName}</option>
            ))}
          </select>

          {/* Room Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Room Types</option>
            <option value="SINGLE">Single Room</option>
            <option value="DOUBLE_SHARING">Double Sharing</option>
            <option value="TRIPLE_SHARING">Triple Sharing</option>
            <option value="FOUR_SHARING">Four Sharing</option>
            <option value="CUSTOM">Custom</option>
          </select>

          {/* Bed status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-lg border border-input bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
          >
            <option value="">All Bed Statuses</option>
            <option value="AVAILABLE">Available Only</option>
            <option value="OCCUPIED">Occupied Only</option>
            <option value="RESERVED">Reserved Only</option>
            <option value="MAINTENANCE">Maintenance Only</option>
          </select>

          {(selectedFloor || selectedType || selectedStatus) && (
            <button
              onClick={() => {
                setSelectedFloor("");
                setSelectedType("");
                setSelectedStatus("");
              }}
              className="text-xs text-primary hover:underline ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Visual Rooms & Beds Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-muted-foreground">Loading room matrix...</div>
        ) : filteredRooms.length === 0 ? (
          <div className="py-20 text-center">
            <Bed className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-semibold">No rooms match your filter</h3>
            <p className="text-xs text-muted-foreground mt-1">Try resetting your filters or add a new room.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              const occupiedCount = room.beds.filter((b: any) => b.status === "OCCUPIED").length;
              const isFull = occupiedCount === room.beds.length && room.beds.length > 0;

              return (
                <Card key={room.id} className="border-border hover:border-primary/40 transition-all shadow-sm">
                  <CardHeader className="pb-3 border-b border-border/60">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">Room {room.roomNumber}</CardTitle>
                          {isFull && <Badge variant="secondary">Full</Badge>}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {room.floor?.floorName} • {room.roomType.replace("_", " ")}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-xs text-foreground">{formatCurrency(room.baseRent)}</div>
                        <span className="text-[10px] text-muted-foreground">/ month</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 text-[11px] text-muted-foreground">
                      <span>{room.hasAc ? "❄️ AC" : "🌀 Non-AC"}</span>
                      <span>•</span>
                      <span>{room.hasAttachedBathroom ? "🚿 Attached Bath" : "Common Bath"}</span>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                      <span>Bed Allocation ({room.beds.length} Beds)</span>
                      <span>
                        {occupiedCount}/{room.beds.length} Occupied
                      </span>
                    </div>

                    {/* Bed Tiles Grid */}
                    <div className="grid grid-cols-2 gap-2.5">
                      {room.beds.map((bed: any) => {
                        const style = getBedStatusColor(bed.status);
                        const isOccupied = bed.status === "OCCUPIED";

                        return (
                          <div
                            key={bed.id}
                            onClick={() => setSelectedBedForEdit(bed)}
                            className={`group relative rounded-xl border p-3 cursor-pointer transition-all hover:scale-[1.02] shadow-xs ${style.bg}`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs tracking-tight">{bed.bedNumber}</span>
                              <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                            </div>

                            <div className="mt-2 text-[11px]">
                              {isOccupied && bed.tenant ? (
                                <div className="truncate font-medium text-foreground">
                                  👤 {bed.tenant.fullName}
                                </div>
                              ) : (
                                <span className="font-medium text-muted-foreground uppercase text-[10px]">
                                  {bed.status}
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>{formatCurrency(bed.monthlyRent)}</span>
                              <span className="opacity-0 group-hover:opacity-100 transition-opacity text-primary font-bold">
                                Edit ⚙
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Modal: Add Room */}
        <Modal
          isOpen={addRoomOpen}
          onClose={() => setAddRoomOpen(false)}
          title="Add New Room & Auto-Generate Beds"
          description="Create a room and automatically generate its corresponding beds"
          maxWidth="xl"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Floor *</label>
                <select
                  required
                  value={roomForm.floorId}
                  onChange={(e) => setRoomForm({ ...roomForm, floorId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="">Select Floor</option>
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>{f.floorName}</option>
                  ))}
                </select>
              </div>

              <Input
                label="Room Number / Name *"
                required
                value={roomForm.roomNumber}
                onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
                placeholder="e.g. 101, 102, G-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Room Type *</label>
                <select
                  value={roomForm.roomType}
                  onChange={(e) => {
                    const val = e.target.value;
                    const beds = val === "SINGLE" ? 1 : val === "DOUBLE_SHARING" ? 2 : val === "TRIPLE_SHARING" ? 3 : 4;
                    setRoomForm({ ...roomForm, roomType: val, numberOfBeds: beds, capacity: beds });
                  }}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="SINGLE">Single Room (1 Bed)</option>
                  <option value="DOUBLE_SHARING">Double Sharing (2 Beds)</option>
                  <option value="TRIPLE_SHARING">Triple Sharing (3 Beds)</option>
                  <option value="FOUR_SHARING">Four Sharing (4 Beds)</option>
                  <option value="CUSTOM">Custom</option>
                </select>
              </div>

              <Input
                label="Number of Beds *"
                type="number"
                min={1}
                max={10}
                required
                value={roomForm.numberOfBeds}
                onChange={(e) => setRoomForm({ ...roomForm, numberOfBeds: Number(e.target.value), capacity: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Monthly Rent per Bed (₹) *"
                type="number"
                min={0}
                required
                value={roomForm.baseRent}
                onChange={(e) => setRoomForm({ ...roomForm, baseRent: Number(e.target.value) })}
              />
              <Input
                label="Security Deposit per Bed (₹)"
                type="number"
                min={0}
                value={roomForm.securityDeposit}
                onChange={(e) => setRoomForm({ ...roomForm, securityDeposit: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={roomForm.hasAc}
                  onChange={(e) => setRoomForm({ ...roomForm, hasAc: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                Air Conditioned (AC)
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground">
                <input
                  type="checkbox"
                  checked={roomForm.hasAttachedBathroom}
                  onChange={(e) => setRoomForm({ ...roomForm, hasAttachedBathroom: e.target.checked })}
                  className="rounded border-input text-primary focus:ring-primary h-4 w-4"
                />
                Attached Bathroom
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setAddRoomOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Create Room & Beds
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Bed Status / Action */}
        <Modal
          isOpen={!!selectedBedForEdit}
          onClose={() => setSelectedBedForEdit(null)}
          title={`Manage Bed ${selectedBedForEdit?.bedNumber}`}
          description={`Update status or assign tenant for Bed ${selectedBedForEdit?.bedNumber}`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-lg bg-accent/50 space-y-1">
              <div>Monthly Rent: <span className="font-semibold text-foreground">{formatCurrency(selectedBedForEdit?.monthlyRent)}</span></div>
              <div>Current Status: <span className="font-semibold uppercase text-primary">{selectedBedForEdit?.status}</span></div>
              {selectedBedForEdit?.tenant && (
                <div>Current Tenant: <span className="font-semibold text-foreground">{selectedBedForEdit.tenant.fullName}</span></div>
              )}
            </div>

            <div className="space-y-2">
              <label className="font-semibold text-foreground">Change Bed Status:</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateBedStatus("AVAILABLE")}
                  className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  Set Available
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateBedStatus("RESERVED")}
                  className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10"
                >
                  Set Reserved
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdateBedStatus("MAINTENANCE")}
                  className="text-slate-600 border-slate-500/30 hover:bg-slate-500/10"
                >
                  Set Maintenance
                </Button>
                <Link href="/tenants/new" className="block">
                  <Button size="sm" className="w-full">
                    Assign Tenant
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </Modal>
      </div>
    </Shell>
  );
}
