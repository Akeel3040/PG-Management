import { prisma } from "@/lib/prisma";
import { BedStatus, TenantStatus, Prisma } from "@prisma/client";

export interface OnboardTenantInput {
  fullName: string;
  gender: string;
  dateOfBirth?: string;
  phone: string;
  whatsapp?: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  occupation?: string;
  companyOrCollege?: string;
  idType?: any;
  idNumber: string;
  idDocumentUrl?: string;
  propertyId: string;
  roomId: string;
  bedId: string;
  joiningDate: string;
  expectedLeavingDate?: string;
  monthlyRent: number;
  securityDeposit?: number;
  advanceAmount?: number;
  noticePeriodDays?: number;
  agreementStartDate?: string;
  agreementEndDate?: string;
  notes?: string;
  currentUserId?: string;
}

export async function onboardTenant(data: OnboardTenantInput) {
  return await prisma.$transaction(async (tx) => {
    // 1. Verify bed availability
    const bed = await tx.bed.findUnique({
      where: { id: data.bedId },
      include: { tenant: true },
    });

    if (!bed) {
      throw new Error("BED_NOT_FOUND");
    }

    if (bed.status !== BedStatus.AVAILABLE) {
      throw new Error("BED_NOT_AVAILABLE");
    }

    if (bed.tenant && bed.tenant.status === TenantStatus.ACTIVE) {
      throw new Error("BED_ALREADY_OCCUPIED");
    }

    // 2. Create Tenant
    const tenant = await tx.tenant.create({
      data: {
        propertyId: data.propertyId,
        roomId: data.roomId,
        bedId: data.bedId,
        fullName: data.fullName,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        phone: data.phone,
        whatsapp: data.whatsapp || data.phone,
        email: data.email,
        address: data.address,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        emergencyContactName: data.emergencyContactName,
        emergencyContactPhone: data.emergencyContactPhone,
        emergencyContactRelation: data.emergencyContactRelation,
        occupation: data.occupation,
        companyOrCollege: data.companyOrCollege,
        idType: data.idType || "AADHAAR",
        idNumber: data.idNumber,
        idDocumentUrl: data.idDocumentUrl,
        joiningDate: new Date(data.joiningDate),
        expectedLeavingDate: data.expectedLeavingDate ? new Date(data.expectedLeavingDate) : undefined,
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit || 0,
        advanceAmount: data.advanceAmount || 0,
        status: TenantStatus.ACTIVE,
        notes: data.notes,
      },
    });

    // 3. Mark Bed as OCCUPIED
    await tx.bed.update({
      where: { id: data.bedId },
      data: { status: BedStatus.OCCUPIED },
    });

    // 4. Create Agreement
    const agreementNumber = `AGR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const agreementStart = data.agreementStartDate ? new Date(data.agreementStartDate) : new Date(data.joiningDate);
    const agreementEnd = data.agreementEndDate
      ? new Date(data.agreementEndDate)
      : new Date(new Date(agreementStart).setFullYear(agreementStart.getFullYear() + 1));

    await tx.tenantAgreement.create({
      data: {
        tenantId: tenant.id,
        propertyId: data.propertyId,
        roomId: data.roomId,
        bedId: data.bedId,
        agreementNumber,
        startDate: agreementStart,
        endDate: agreementEnd,
        monthlyRent: data.monthlyRent,
        securityDeposit: data.securityDeposit || 0,
        noticePeriodDays: data.noticePeriodDays || 30,
        status: "ACTIVE",
      },
    });

    // 5. Create Check-In Record
    await tx.tenantCheckIn.create({
      data: {
        tenantId: tenant.id,
        propertyId: data.propertyId,
        roomId: data.roomId,
        bedId: data.bedId,
        checkInDate: new Date(data.joiningDate),
        rent: data.monthlyRent,
        deposit: data.securityDeposit || 0,
        advanceAmount: data.advanceAmount || 0,
        agreementStartDate: agreementStart,
        agreementEndDate: agreementEnd,
        notes: data.notes || "Onboarded & checked in",
      },
    });

    // 6. Audit Log
    await tx.activityLog.create({
      data: {
        userId: data.currentUserId,
        propertyId: data.propertyId,
        action: "TENANT_ONBOARDED",
        entity: "Tenant",
        entityId: tenant.id,
        details: `Onboarded ${tenant.fullName} into Room ${data.roomId}, Bed ${data.bedId}`,
      },
    });

    return tenant;
  });
}

export interface CheckOutInput {
  tenantId: string;
  propertyId: string;
  checkOutDate: string;
  reason?: string;
  pendingRentDues?: number;
  utilityDues?: number;
  damageCharges?: number;
  refundableDeposit?: number;
  finalSettlementAmount?: number;
  settlementStatus?: string;
  notes?: string;
  currentUserId?: string;
}

export async function checkOutTenant(data: CheckOutInput) {
  return await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.findUnique({
      where: { id: data.tenantId },
    });

    if (!tenant) {
      throw new Error("TENANT_NOT_FOUND");
    }

    if (tenant.status === TenantStatus.CHECKED_OUT) {
      throw new Error("TENANT_ALREADY_CHECKED_OUT");
    }

    const bedId = tenant.bedId;

    // 1. Create Checkout Record
    const checkoutRecord = await tx.tenantCheckOut.create({
      data: {
        tenantId: tenant.id,
        propertyId: data.propertyId,
        checkOutDate: new Date(data.checkOutDate),
        reason: data.reason,
        pendingRentDues: data.pendingRentDues || 0,
        utilityDues: data.utilityDues || 0,
        damageCharges: data.damageCharges || 0,
        refundableDeposit: data.refundableDeposit || 0,
        finalSettlementAmount: data.finalSettlementAmount || 0,
        settlementStatus: data.settlementStatus || "SETTLED",
        notes: data.notes,
      },
    });

    // 2. Mark Tenant as CHECKED_OUT and unassign bed
    await tx.tenant.update({
      where: { id: tenant.id },
      data: {
        status: TenantStatus.CHECKED_OUT,
        actualLeavingDate: new Date(data.checkOutDate),
        bedId: null,
      },
    });

    // 3. Release the Bed to AVAILABLE
    if (bedId) {
      await tx.bed.update({
        where: { id: bedId },
        data: { status: BedStatus.AVAILABLE },
      });
    }

    // 4. Terminate active agreements
    await tx.tenantAgreement.updateMany({
      where: { tenantId: tenant.id, status: "ACTIVE" },
      data: { status: "TERMINATED" },
    });

    // 5. Audit Log
    await tx.activityLog.create({
      data: {
        userId: data.currentUserId,
        propertyId: data.propertyId,
        action: "TENANT_CHECKED_OUT",
        entity: "Tenant",
        entityId: tenant.id,
        details: `Checked out ${tenant.fullName}. Bed released to AVAILABLE. Settlement: ${data.finalSettlementAmount}`,
      },
    });

    return checkoutRecord;
  });
}
