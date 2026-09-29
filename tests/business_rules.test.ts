import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "../lib/prisma";
import { onboardTenant, checkOutTenant } from "../lib/services/tenant.service";
import { generateRentInvoice, recordPayment } from "../lib/services/rent.service";
import { BedStatus, TenantStatus, InvoiceStatus, PaymentMethod } from "@prisma/client";

describe("PG Management Business Logic & Transactions", () => {
  let testPropertyId: string;
  let testRoomId: string;
  let testBedId: string;
  let createdTenantId: string;

  beforeAll(async () => {
    // Look for existing property and available bed from seed
    const property = await prisma.property.findFirst();
    if (!property) throw new Error("Seed property required");
    testPropertyId = property.id;

    // Create a dedicated room and bed for tests
    const floor = await prisma.floor.findFirst({ where: { propertyId: testPropertyId } });
    if (!floor) throw new Error("Floor required");

    const room = await prisma.room.create({
      data: {
        propertyId: testPropertyId,
        floorId: floor.id,
        roomNumber: "TEST-999",
        capacity: 1,
        numberOfBeds: 1,
        baseRent: 12000,
        securityDeposit: 24000,
        status: "AVAILABLE",
      },
    });
    testRoomId = room.id;

    const bed = await prisma.bed.create({
      data: {
        propertyId: testPropertyId,
        roomId: testRoomId,
        bedNumber: "TEST-BED-1",
        monthlyRent: 12000,
        securityDeposit: 24000,
        status: BedStatus.AVAILABLE,
      },
    });
    testBedId = bed.id;
  });

  afterAll(async () => {
    // Cleanup test records
    await prisma.activityLog.deleteMany({ where: { propertyId: testPropertyId, entityId: createdTenantId } });
    await prisma.payment.deleteMany({ where: { propertyId: testPropertyId, tenantId: createdTenantId } });
    await prisma.rentInvoice.deleteMany({ where: { propertyId: testPropertyId, tenantId: createdTenantId } });
    await prisma.tenantCheckOut.deleteMany({ where: { propertyId: testPropertyId, tenantId: createdTenantId } });
    await prisma.tenantCheckIn.deleteMany({ where: { propertyId: testPropertyId, tenantId: createdTenantId } });
    await prisma.tenantAgreement.deleteMany({ where: { propertyId: testPropertyId, tenantId: createdTenantId } });
    if (createdTenantId) {
      await prisma.tenant.deleteMany({ where: { id: createdTenantId } });
    }
    await prisma.bed.deleteMany({ where: { id: testBedId } });
    await prisma.room.deleteMany({ where: { id: testRoomId } });
  });

  it("should onboard a tenant, lock bed to OCCUPIED and create agreement", async () => {
    const tenant = await onboardTenant({
      fullName: "Test Tenant One",
      gender: "Male",
      phone: "+91 99999 88888",
      email: "testtenant1@example.com",
      address: "123 Test Street",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560001",
      emergencyContactName: "Test Contact",
      emergencyContactPhone: "+91 99999 77777",
      emergencyContactRelation: "Parent",
      idNumber: "TEST123456",
      propertyId: testPropertyId,
      roomId: testRoomId,
      bedId: testBedId,
      joiningDate: "2026-09-01",
      monthlyRent: 12000,
      securityDeposit: 24000,
      advanceAmount: 12000,
    });

    expect(tenant).toBeDefined();
    expect(tenant.id).toBeDefined();
    expect(tenant.status).toBe(TenantStatus.ACTIVE);
    createdTenantId = tenant.id;

    // Verify bed is now marked OCCUPIED
    const bed = await prisma.bed.findUnique({ where: { id: testBedId } });
    expect(bed?.status).toBe(BedStatus.OCCUPIED);

    // Verify agreement was created
    const agreement = await prisma.tenantAgreement.findFirst({
      where: { tenantId: tenant.id },
    });
    expect(agreement).toBeDefined();
    expect(agreement?.status).toBe("ACTIVE");
    expect(agreement?.monthlyRent).toBe(12000);
  });

  it("should PREVENT assigning two active tenants to the same bed", async () => {
    // Attempt to onboard another tenant into the same bed that is now OCCUPIED
    await expect(
      onboardTenant({
        fullName: "Test Tenant Two",
        gender: "Female",
        phone: "+91 99999 66666",
        email: "testtenant2@example.com",
        address: "456 Test Street",
        city: "Bengaluru",
        state: "Karnataka",
        pincode: "560001",
        emergencyContactName: "Test Contact 2",
        emergencyContactPhone: "+91 99999 55555",
        emergencyContactRelation: "Friend",
        idNumber: "TEST987654",
        propertyId: testPropertyId,
        roomId: testRoomId,
        bedId: testBedId,
        joiningDate: "2026-09-01",
        monthlyRent: 12000,
      })
    ).rejects.toThrow("BED_NOT_AVAILABLE");
  });

  it("should generate rent invoice with correct total calculation", async () => {
    const invoice = await generateRentInvoice({
      tenantId: createdTenantId,
      propertyId: testPropertyId,
      billingMonth: "2026-10",
      dueDate: "2026-10-05",
      rentAmount: 12000,
      utilityCharges: 500,
      lateFee: 200,
      discount: 300,
    });

    expect(invoice).toBeDefined();
    // 12000 + 500 + 200 - 300 = 12400
    expect(invoice.totalAmount).toBe(12400);
    expect(invoice.balanceAmount).toBe(12400);
    expect(invoice.paidAmount).toBe(0);
    expect(invoice.status).toBe(InvoiceStatus.PENDING);
  });

  it("should record partial and full payments and update invoice status", async () => {
    const invoice = await prisma.rentInvoice.findFirst({
      where: { tenantId: createdTenantId, billingMonth: "2026-10" },
    });
    expect(invoice).not.toBeNull();

    // Partial payment of 6000
    const payment1 = await recordPayment({
      tenantId: createdTenantId,
      propertyId: testPropertyId,
      invoiceId: invoice!.id,
      amount: 6000,
      paymentDate: "2026-10-02",
      paymentMethod: PaymentMethod.UPI,
      transactionId: "TXN1001",
    });

    expect(payment1.amount).toBe(6000);

    const updatedInvoice1 = await prisma.rentInvoice.findUnique({
      where: { id: invoice!.id },
    });
    expect(updatedInvoice1?.paidAmount).toBe(6000);
    expect(updatedInvoice1?.balanceAmount).toBe(6400);
    expect(updatedInvoice1?.status).toBe(InvoiceStatus.PARTIALLY_PAID);

    // Full remaining payment of 6400
    await recordPayment({
      tenantId: createdTenantId,
      propertyId: testPropertyId,
      invoiceId: invoice!.id,
      amount: 6400,
      paymentDate: "2026-10-03",
      paymentMethod: PaymentMethod.CASH,
    });

    const updatedInvoice2 = await prisma.rentInvoice.findUnique({
      where: { id: invoice!.id },
    });
    expect(updatedInvoice2?.balanceAmount).toBe(0);
    expect(updatedInvoice2?.status).toBe(InvoiceStatus.PAID);
  });

  it("should reject payment exceeding balance", async () => {
    const invoice = await prisma.rentInvoice.findFirst({
      where: { tenantId: createdTenantId, billingMonth: "2026-10" },
    });

    // Invoice is now fully paid (balance 0)
    await expect(
      recordPayment({
        tenantId: createdTenantId,
        propertyId: testPropertyId,
        invoiceId: invoice!.id,
        amount: 100,
        paymentDate: "2026-10-04",
        paymentMethod: PaymentMethod.UPI,
      })
    ).rejects.toThrow("PAYMENT_EXCEEDS_BALANCE");
  });

  it("should check out tenant and RELEASE the bed back to AVAILABLE", async () => {
    const checkout = await checkOutTenant({
      tenantId: createdTenantId,
      propertyId: testPropertyId,
      checkOutDate: "2026-10-31",
      reason: "Relocating to another city",
      refundableDeposit: 24000,
      finalSettlementAmount: 24000,
    });

    expect(checkout).toBeDefined();

    // Verify tenant status is CHECKED_OUT and bed is released
    const tenant = await prisma.tenant.findUnique({
      where: { id: createdTenantId },
    });
    expect(tenant?.status).toBe(TenantStatus.CHECKED_OUT);
    expect(tenant?.bedId).toBeNull();

    // Verify bed status is now AVAILABLE
    const bed = await prisma.bed.findUnique({ where: { id: testBedId } });
    expect(bed?.status).toBe(BedStatus.AVAILABLE);

    // Verify agreement is TERMINATED
    const agreement = await prisma.tenantAgreement.findFirst({
      where: { tenantId: createdTenantId },
    });
    expect(agreement?.status).toBe("TERMINATED");
  });
});
