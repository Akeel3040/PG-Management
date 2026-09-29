"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  FileCheck,
  Building2,
  Bed,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { Shell } from "@/components/layout/shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProperty } from "@/components/property-context";
import { formatCurrency } from "@/lib/utils";

export default function TenantOnboardingPage() {
  const router = useRouter();
  const { properties, selectedPropertyId } = useProperty();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic property rooms and beds
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [availableBeds, setAvailableBeds] = useState<any[]>([]);

  // Form state
  const [form, setForm] = useState({
    // Step 1: Personal
    fullName: "",
    gender: "Male",
    dateOfBirth: "",
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "Parent",
    occupation: "Software Professional",
    companyOrCollege: "",

    // Step 2: KYC
    idType: "AADHAAR",
    idNumber: "",
    idDocumentUrl: "",

    // Step 3: Bed allocation
    propertyId: selectedPropertyId || (properties[0]?.id ?? ""),
    roomId: "",
    bedId: "",

    // Step 4: Rent & Agreement
    joiningDate: new Date().toISOString().split("T")[0],
    expectedLeavingDate: "",
    monthlyRent: 10000,
    securityDeposit: 20000,
    advanceAmount: 10000,
    noticePeriodDays: 30,
    agreementStartDate: new Date().toISOString().split("T")[0],
    agreementEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    notes: "",
  });

  // Load rooms when property changes
  useEffect(() => {
    async function loadRooms() {
      if (!form.propertyId) return;
      try {
        const res = await fetch(`/api/rooms?propertyId=${form.propertyId}`);
        if (res.ok) {
          const rooms = await res.json();
          setAvailableRooms(rooms);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadRooms();
  }, [form.propertyId]);

  // Load available beds when room changes
  useEffect(() => {
    if (!form.roomId) {
      setAvailableBeds([]);
      return;
    }
    const selectedRoom = availableRooms.find((r) => r.id === form.roomId);
    if (selectedRoom) {
      const freeBeds = selectedRoom.beds.filter((b: any) => b.status === "AVAILABLE");
      setAvailableBeds(freeBeds);
      if (freeBeds.length > 0) {
        setForm((prev) => ({
          ...prev,
          bedId: freeBeds[0].id,
          monthlyRent: freeBeds[0].monthlyRent || selectedRoom.baseRent,
          securityDeposit: freeBeds[0].securityDeposit || selectedRoom.securityDeposit,
        }));
      }
    }
  }, [form.roomId, availableRooms]);

  const handleSubmitOnboarding = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Onboarding failed");
        return;
      }

      router.push(`/tenants/${data.tenant.id}`);
    } catch (err) {
      setError("An unexpected error occurred during submission");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: "Personal Details", icon: User },
    { num: 2, title: "KYC & Identity", icon: FileCheck },
    { num: 3, title: "Room & Bed Allocation", icon: Bed },
    { num: 4, title: "Rent & Agreement", icon: ShieldCheck },
    { num: 5, title: "Review & Confirm", icon: CheckCircle2 },
  ];

  return (
    <Shell>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button onClick={() => router.push("/tenants")} variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Tenant Onboarding Flow</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Multi-step wizard to register tenant, assign bed, set rent, and generate agreement
            </p>
          </div>
        </div>

        {/* Step Progress Tracker */}
        <div className="flex items-center justify-between border-b border-border pb-4 overflow-x-auto no-scrollbar">
          {steps.map((s) => {
            const Icon = s.icon;
            const isDone = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="flex items-center gap-2 whitespace-nowrap px-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                    isCurrent
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : isDone
                      ? "bg-emerald-500 text-white"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isDone ? "✓" : s.num}
                </div>
                <div className="hidden sm:block text-xs">
                  <div className={`font-semibold ${isCurrent ? "text-primary" : "text-muted-foreground"}`}>
                    {s.title}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Personal Details */}
        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 1: Tenant Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Full Name *"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Aditya Sharma"
                />
                <div className="space-y-1">
                  <label className="font-medium text-foreground">Gender *</label>
                  <select
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Phone Number (WhatsApp) *"
                  required
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value, whatsapp: e.target.value })}
                  placeholder="+91 98765 43210"
                />
                <Input
                  label="Email Address *"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="tenant@email.com"
                />
              </div>

              <Input
                label="Permanent Address *"
                required
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House No, Street name"
              />

              <div className="grid grid-cols-3 gap-3">
                <Input
                  label="City *"
                  required
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                  placeholder="Jaipur"
                />
                <Input
                  label="State *"
                  required
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                  placeholder="Rajasthan"
                />
                <Input
                  label="Pincode *"
                  required
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                  placeholder="302001"
                />
              </div>

              <div className="border-t border-border pt-3">
                <h4 className="font-semibold text-foreground mb-2">Emergency Contact</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Contact Name *"
                    required
                    value={form.emergencyContactName}
                    onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                    placeholder="Father/Mother Name"
                  />
                  <Input
                    label="Contact Phone *"
                    required
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                    placeholder="+91 98111 22233"
                  />
                  <Input
                    label="Relation *"
                    required
                    value={form.emergencyContactRelation}
                    onChange={(e) => setForm({ ...form, emergencyContactRelation: e.target.value })}
                    placeholder="Parent / Sibling / Friend"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <Button
                  onClick={() => {
                    if (!form.fullName || !form.phone || !form.email) {
                      setError("Please fill in Name, Phone, and Email");
                      return;
                    }
                    setError(null);
                    setStep(2);
                  }}
                >
                  Continue to KYC <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 2: KYC Details */}
        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 2: KYC & Identification Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-medium text-foreground">ID Proof Type *</label>
                  <select
                    value={form.idType}
                    onChange={(e) => setForm({ ...form, idType: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                  >
                    <option value="AADHAAR">Aadhaar Card</option>
                    <option value="PAN">PAN Card</option>
                    <option value="PASSPORT">Passport</option>
                    <option value="DRIVING_LICENSE">Driving License</option>
                    <option value="VOTER_ID">Voter ID</option>
                  </select>
                </div>
                <Input
                  label="ID Number *"
                  required
                  value={form.idNumber}
                  onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
                  placeholder="e.g. 1234 5678 9012"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Occupation"
                  value={form.occupation}
                  onChange={(e) => setForm({ ...form, occupation: e.target.value })}
                  placeholder="Software Engineer / Student"
                />
                <Input
                  label="Company or College Name"
                  value={form.companyOrCollege}
                  onChange={(e) => setForm({ ...form, companyOrCollege: e.target.value })}
                  placeholder="Infosys / Bangalore University"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button
                  onClick={() => {
                    if (!form.idNumber) {
                      setError("Please provide ID number");
                      return;
                    }
                    setError(null);
                    setStep(3);
                  }}
                >
                  Continue to Room Selection <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3: Room & Bed Selection */}
        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 3: Property, Room & Bed Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-foreground">Select Property *</label>
                <select
                  value={form.propertyId}
                  onChange={(e) => setForm({ ...form, propertyId: e.target.value, roomId: "", bedId: "" })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Select Room *</label>
                <select
                  value={form.roomId}
                  onChange={(e) => setForm({ ...form, roomId: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                >
                  <option value="">-- Choose a Room --</option>
                  {availableRooms.map((r) => {
                    const freeBeds = r.beds.filter((b: any) => b.status === "AVAILABLE").length;
                    return (
                      <option key={r.id} value={r.id} disabled={freeBeds === 0}>
                        Room {r.roomNumber} ({r.roomType}) - {freeBeds} available beds (Rent: {formatCurrency(r.baseRent)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {form.roomId && (
                <div className="space-y-2">
                  <label className="font-medium text-foreground">Select Available Bed *</label>
                  {availableBeds.length === 0 ? (
                    <p className="text-xs text-rose-500">No beds available in this room. Please select another room.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {availableBeds.map((bed) => (
                        <div
                          key={bed.id}
                          onClick={() =>
                            setForm({
                              ...form,
                              bedId: bed.id,
                              monthlyRent: bed.monthlyRent,
                              securityDeposit: bed.securityDeposit,
                            })
                          }
                          className={`cursor-pointer rounded-xl border p-3 text-center transition-all ${
                            form.bedId === bed.id
                              ? "border-primary bg-primary/10 font-bold shadow-xs"
                              : "border-border hover:bg-accent"
                          }`}
                        >
                          <div className="text-sm font-bold">{bed.bedNumber}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">
                            {formatCurrency(bed.monthlyRent)}/mo
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button
                  disabled={!form.bedId}
                  onClick={() => {
                    if (!form.bedId) {
                      setError("Please select a room and bed");
                      return;
                    }
                    setError(null);
                    setStep(4);
                  }}
                >
                  Continue to Rent Details <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4: Rent & Agreement */}
        {step === 4 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 4: Rent, Security Deposit & Agreement Period</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Monthly Rent (₹) *"
                  type="number"
                  min={0}
                  required
                  value={form.monthlyRent}
                  onChange={(e) => setForm({ ...form, monthlyRent: Number(e.target.value) })}
                />
                <Input
                  label="Security Deposit (₹) *"
                  type="number"
                  min={0}
                  required
                  value={form.securityDeposit}
                  onChange={(e) => setForm({ ...form, securityDeposit: Number(e.target.value) })}
                />
                <Input
                  label="Advance Amount Paid (₹)"
                  type="number"
                  min={0}
                  value={form.advanceAmount}
                  onChange={(e) => setForm({ ...form, advanceAmount: Number(e.target.value) })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Joining Date *"
                  type="date"
                  required
                  value={form.joiningDate}
                  onChange={(e) => setForm({ ...form, joiningDate: e.target.value })}
                />
                <Input
                  label="Agreement End Date"
                  type="date"
                  value={form.agreementEndDate}
                  onChange={(e) => setForm({ ...form, agreementEndDate: e.target.value })}
                />
                <Input
                  label="Notice Period (Days)"
                  type="number"
                  min={0}
                  value={form.noticePeriodDays}
                  onChange={(e) => setForm({ ...form, noticePeriodDays: Number(e.target.value) })}
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-foreground">Internal Staff Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Luggage details, shift timings, special requests..."
                  className="w-full rounded-lg border border-input bg-background p-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button onClick={() => setStep(5)}>
                  Review & Confirm <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5: Review & Confirm */}
        {step === 5 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Step 5: Review & Confirm Check-In</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="rounded-xl border border-border bg-accent/30 p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">Tenant Name:</span>
                    <div className="font-bold text-sm text-foreground">{form.fullName}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Phone & WhatsApp:</span>
                    <div className="font-semibold text-foreground">{form.phone}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">ID Proof:</span>
                    <div className="font-semibold text-foreground">{form.idType}: {form.idNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Joining Date:</span>
                    <div className="font-semibold text-foreground">{form.joiningDate}</div>
                  </div>
                </div>

                <div className="border-t border-border/60 pt-3 grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground">Monthly Rent:</span>
                    <div className="font-bold text-base text-emerald-600">{formatCurrency(form.monthlyRent)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Security Deposit:</span>
                    <div className="font-bold text-base text-foreground">{formatCurrency(form.securityDeposit)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Advance Paid:</span>
                    <div className="font-bold text-base text-primary">{formatCurrency(form.advanceAmount)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-emerald-700 dark:text-emerald-400">
                ✓ Bed will be automatically locked as <strong>OCCUPIED</strong>, check-in history record logged, and 12-month lease agreement generated.
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <Button variant="outline" onClick={() => setStep(4)}>
                  <ArrowLeft className="h-4 w-4 mr-1.5" /> Back
                </Button>
                <Button onClick={handleSubmitOnboarding} isLoading={submitting} size="lg">
                  Confirm & Complete Check-In
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Shell>
  );
}
