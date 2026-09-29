"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Plus,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Bed,
  Users,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-context";
import { useProperty } from "@/components/property-context";

export default function PropertiesPage() {
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { refreshProperties } = useProperty();

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
    email: "",
    googleMapsUrl: "",
    description: "",
    rules: "",
    totalFloors: 5,
  });

  const loadProperties = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/properties?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        const data = await res.json();
        setProperties(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, [search]);

  const handleCreateProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create property");
        return;
      }

      setModalOpen(false);
      setFormData({
        name: "",
        code: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: "",
        googleMapsUrl: "",
        description: "",
        rules: "",
        totalFloors: 5,
      });
      loadProperties();
      await refreshProperties();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const isOwnerOrAdmin = user?.role === "OWNER" || user?.role === "SUPER_ADMIN";

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Property Management</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Manage your hostel buildings, branches, floor counts, and configurations
            </p>
          </div>
          {isOwnerOrAdmin && (
            <Button onClick={() => setModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1.5" /> Add New Property
            </Button>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by property name, code, or city..."
              className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
          </div>
        </div>

        {/* Properties Grid */}
        {loading ? (
          <div className="py-16 text-center text-xs text-muted-foreground">Loading properties...</div>
        ) : properties.length === 0 ? (
          <div className="py-16 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-3 text-sm font-semibold">No properties found</h3>
            <p className="text-xs text-muted-foreground mt-1">Get started by creating your first PG hostel.</p>
            {isOwnerOrAdmin && (
              <Button onClick={() => setModalOpen(true)} size="sm" className="mt-4">
                <Plus className="h-4 w-4 mr-1.5" /> Add Property
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((p) => (
              <Card key={p.id} className="flex flex-col justify-between hover:border-primary/50 transition-all shadow-sm">
                <div>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">{p.name}</CardTitle>
                        <span className="inline-block mt-1 font-mono text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {p.code}
                        </span>
                      </div>
                      <Badge variant={p.status === "ACTIVE" ? "success" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 text-xs">
                    <div className="space-y-1.5 text-muted-foreground">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-foreground" />
                        <span>{p.address}, {p.city}, {p.state} - {p.pincode}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5 shrink-0 text-foreground" />
                        <span>{p.phone}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-foreground" />
                        <span>{p.email}</span>
                      </div>
                    </div>

                    {/* Stats metrics */}
                    <div className="grid grid-cols-3 gap-2 rounded-lg bg-accent/40 p-2.5 text-center">
                      <div>
                        <div className="text-base font-bold text-foreground">{p.totalFloors}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Floors</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground">{p._count?.rooms || 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Rooms</div>
                      </div>
                      <div>
                        <div className="text-base font-bold text-foreground">{p._count?.tenants || 0}</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Tenants</div>
                      </div>
                    </div>

                    {/* Occupancy bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground">Bed Occupancy</span>
                        <span className="font-semibold text-foreground">
                          {p.occupiedBeds || 0} / {p.totalBeds || 0} ({p.occupancy || 0}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${p.occupancy || 0}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </div>

                <div className="p-4 pt-0 border-t border-border mt-4 flex items-center justify-between">
                  {p.googleMapsUrl ? (
                    <a
                      href={p.googleMapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <MapPin className="h-3 w-3" /> View Map
                    </a>
                  ) : <div />}
                  <Link href={`/properties/${p.id}`}>
                    <Button variant="outline" size="sm" className="text-xs">
                      View Details & Tabs →
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Modal: Create Property */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Add New Property / PG Branch"
          description="Register a new building into your multi-property system"
          maxWidth="2xl"
        >
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreateProperty} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Property Name *"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Sunrise Elite PG"
              />
              <Input
                label="Unique Code *"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SUN-KOR-01"
              />
            </div>

            <Input
              label="Complete Street Address *"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Building No., Street, Area"
            />

            <div className="grid grid-cols-3 gap-3">
              <Input
                label="City *"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Bengaluru"
              />
              <Input
                label="State *"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Karnataka"
              />
              <Input
                label="Pincode *"
                required
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                placeholder="560095"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Contact Phone *"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
              <Input
                label="Contact Email *"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@pg.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Number of Floors *"
                type="number"
                min={1}
                max={20}
                required
                value={formData.totalFloors}
                onChange={(e) => setFormData({ ...formData, totalFloors: Number(e.target.value) })}
              />
              <Input
                label="Google Maps Location URL"
                value={formData.googleMapsUrl}
                onChange={(e) => setFormData({ ...formData, googleMapsUrl: e.target.value })}
                placeholder="https://maps.google.com/..."
              />
            </div>

            <div className="space-y-1">
              <label className="font-medium text-foreground">PG House Rules</label>
              <textarea
                rows={2}
                value={formData.rules}
                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                placeholder="1. Gate closing time 11 PM&#10;2. No smoking&#10;3. Visitors till 8 PM"
                className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting}>
                Save Property
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Shell>
  );
}
