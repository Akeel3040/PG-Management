"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Building2,
  Bed,
  Users,
  CreditCard,
  TrendingDown,
  MessageSquareWarning,
  UserCheck,
  Briefcase,
  Bell,
  BarChart3,
  Settings,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Plus,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs } from "@/components/ui/tabs";
import { formatCurrency, formatDate, getBedStatusColor, getComplaintStatusColor } from "@/lib/utils";

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;

  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function loadProperty() {
      setLoading(true);
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (res.ok) {
          const data = await res.json();
          setProperty(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProperty();
  }, [propertyId]);

  if (loading) {
    return (
      <Shell>
        <div className="py-24 text-center text-xs text-muted-foreground">Loading property details...</div>
      </Shell>
    );
  }

  if (!property) {
    return (
      <Shell>
        <div className="py-24 text-center">
          <h2 className="text-sm font-semibold">Property not found</h2>
          <Button onClick={() => router.push("/properties")} variant="outline" size="sm" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Properties
          </Button>
        </div>
      </Shell>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: <Building2 className="h-4 w-4" /> },
    { id: "rooms", label: "Rooms", count: property.stats?.totalRooms, icon: <Building2 className="h-4 w-4" /> },
    { id: "beds", label: "Beds", count: property.stats?.totalBeds, icon: <Bed className="h-4 w-4" /> },
    { id: "tenants", label: "Tenants", count: property.stats?.activeTenants, icon: <Users className="h-4 w-4" /> },
    { id: "staff", label: "Staff", count: property.staffMembers?.length, icon: <Briefcase className="h-4 w-4" /> },
    { id: "complaints", label: "Complaints", count: property.complaints?.length, icon: <MessageSquareWarning className="h-4 w-4" /> },
    { id: "notices", label: "Notices", count: property.notices?.length, icon: <Bell className="h-4 w-4" /> },
  ];

  const allBeds = property.floors?.flatMap((f: any) =>
    f.rooms.flatMap((r: any) =>
      r.beds.map((b: any) => ({ ...b, roomNumber: r.roomNumber, floorName: f.floorName }))
    )
  ) || [];

  return (
    <Shell>
      <div className="space-y-6">
        {/* Top bar with back button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push("/properties")} variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{property.name}</h1>
                <Badge variant={property.status === "ACTIVE" ? "success" : "secondary"}>
                  {property.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <MapPin className="h-3 w-3" /> {property.address}, {property.city}, {property.state} • Code:{" "}
                <span className="font-mono font-semibold text-primary">{property.code}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/tenants/new`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1.5" /> Onboard Tenant
              </Button>
            </Link>
          </div>
        </div>

        {/* Tab switcher */}
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Tab 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">Occupancy Rate</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {property.stats?.occupancyPercentage}%
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {property.stats?.occupiedBeds} occupied / {property.stats?.totalBeds} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">Available Beds</span>
                  <div className="text-2xl font-bold text-primary mt-1">
                    {property.stats?.availableBeds}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Ready for immediate check-in</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">Total Rooms</span>
                  <div className="text-2xl font-bold mt-1">{property.stats?.totalRooms}</div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{property.totalFloors} floors</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <span className="text-xs text-muted-foreground">Active Tenants</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">
                    {property.stats?.activeTenants}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Registered residents</p>
                </CardContent>
              </Card>
            </div>

            {/* Description & Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">About Property & Amenities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-muted-foreground">
                  <p className="leading-relaxed">{property.description || "No description provided."}</p>
                  <div>
                    <h4 className="font-semibold text-foreground mb-2">Amenities Included</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {property.amenities?.length > 0 ? (
                        property.amenities.map((a: any) => (
                          <span
                            key={a.id}
                            className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-secondary-foreground"
                          >
                            ✓ {a.name}
                          </span>
                        ))
                      ) : (
                        <p className="text-muted-foreground">Standard Wi-Fi, Food & Housekeeping</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Hostel Rules & Regulations</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed">
                  {property.rules || "Standard PG rules apply."}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: ROOMS */}
        {activeTab === "rooms" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Rooms by Floor</h3>
              <Link href="/rooms">
                <Button variant="outline" size="sm">
                  View Full Visual Room Matrix →
                </Button>
              </Link>
            </div>

            <div className="space-y-6">
              {property.floors?.map((floor: any) => (
                <div key={floor.id} className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {floor.floorName} ({floor.rooms.length} Rooms)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {floor.rooms.map((room: any) => (
                      <Card key={room.id} className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">Room {room.roomNumber}</span>
                          <Badge variant="outline">{room.roomType}</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div>Beds: {room.beds.length}</div>
                          <div>Rent: {formatCurrency(room.baseRent)}</div>
                          <div>AC: {room.hasAc ? "Yes" : "No"}</div>
                          <div>Bath: {room.hasAttachedBathroom ? "Attached" : "Common"}</div>
                        </div>
                        <div className="flex items-center gap-1.5 pt-2 border-t border-border">
                          {room.beds.map((b: any) => {
                            const colors = getBedStatusColor(b.status);
                            return (
                              <span
                                key={b.id}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors.bg}`}
                                title={`${b.bedNumber}: ${b.status}`}
                              >
                                {b.bedNumber}
                              </span>
                            );
                          })}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: BEDS */}
        {activeTab === "beds" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">All Beds ({allBeds.length})</h3>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Bed Number</th>
                    <th className="p-3">Floor & Room</th>
                    <th className="p-3">Monthly Rent</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Current Tenant</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {allBeds.map((bed: any) => {
                    const colors = getBedStatusColor(bed.status);
                    return (
                      <tr key={bed.id} className="hover:bg-accent/30">
                        <td className="p-3 font-semibold">{bed.bedNumber}</td>
                        <td className="p-3 text-muted-foreground">{bed.floorName} • Room {bed.roomNumber}</td>
                        <td className="p-3 font-medium">{formatCurrency(bed.monthlyRent)}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${colors.bg}`}>
                            {bed.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {bed.tenant ? (
                            <Link href={`/tenants/${bed.tenant.id}`} className="font-semibold text-primary hover:underline">
                              {bed.tenant.fullName}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: TENANTS */}
        {activeTab === "tenants" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Registered Active Tenants</h3>
              <Link href="/tenants/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1.5" /> Onboard Tenant
                </Button>
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Tenant Name</th>
                    <th className="p-3">Room & Bed</th>
                    <th className="p-3">Phone</th>
                    <th className="p-3">Joined Date</th>
                    <th className="p-3">Monthly Rent</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {property.tenants?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-muted-foreground">No active tenants</td>
                    </tr>
                  ) : (
                    property.tenants?.map((t: any) => (
                      <tr key={t.id} className="hover:bg-accent/30">
                        <td className="p-3 font-semibold">{t.fullName}</td>
                        <td className="p-3 text-muted-foreground">Room {t.room?.roomNumber} • Bed {t.bed?.bedNumber}</td>
                        <td className="p-3">{t.phone}</td>
                        <td className="p-3 text-muted-foreground">{formatDate(t.joiningDate)}</td>
                        <td className="p-3 font-medium">{formatCurrency(t.monthlyRent)}</td>
                        <td className="p-3 text-right">
                          <Link href={`/tenants/${t.id}`}>
                            <Button variant="outline" size="sm" className="text-xs">
                              View Profile
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
        )}

        {/* Tab 5: STAFF */}
        {activeTab === "staff" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Property Staff Members</h3>
              <Link href="/staff">
                <Button size="sm">Manage Staff</Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {property.staffMembers?.length === 0 ? (
                <p className="text-xs text-muted-foreground col-span-3">No staff members assigned</p>
              ) : (
                property.staffMembers?.map((s: any) => (
                  <Card key={s.id} className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">{s.name}</span>
                      <Badge variant="outline">{s.role}</Badge>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      <div>Phone: {s.phone}</div>
                      <div>Salary: {formatCurrency(s.salary)}</div>
                      <div>Joined: {formatDate(s.joiningDate)}</div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: COMPLAINTS */}
        {activeTab === "complaints" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Complaints</h3>
              <Link href="/complaints">
                <Button size="sm">View All Complaints</Button>
              </Link>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-muted/50 font-semibold text-muted-foreground">
                  <tr>
                    <th className="p-3">Ticket</th>
                    <th className="p-3">Tenant</th>
                    <th className="p-3">Issue</th>
                    <th className="p-3">Priority</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {property.complaints?.map((c: any) => {
                    const statusClass = getComplaintStatusColor(c.status);
                    return (
                      <tr key={c.id} className="hover:bg-accent/30">
                        <td className="p-3 font-mono font-bold text-primary">{c.ticketNumber}</td>
                        <td className="p-3 font-medium">{c.tenant?.fullName}</td>
                        <td className="p-3 font-semibold">{c.title}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold border border-border">
                            {c.priority}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${statusClass}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="p-3 text-muted-foreground">{formatDate(c.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 7: NOTICES */}
        {activeTab === "notices" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Notices & Announcements</h3>
              <Link href="/notices">
                <Button size="sm">Notice Board</Button>
              </Link>
            </div>
            <div className="space-y-3">
              {property.notices?.map((n: any) => (
                <Card key={n.id} className="p-4 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-foreground">{n.title}</h4>
                    <span className="text-[11px] text-muted-foreground">{formatDate(n.publishDate)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{n.content}</p>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
}
