import { prisma } from "@/lib/prisma";
import { InvoiceStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

export interface GenerateInvoiceInput {
  tenantId: string;
  propertyId: string;
  billingMonth: string; // YYYY-MM
  dueDate: string;
  rentAmount: number;
  previousBalance?: number;
  lateFee?: number;
  utilityCharges?: number;
  otherCharges?: number;
  discount?: number;
  notes?: string;
  currentUserId?: string;
}

export async function generateRentInvoice(data: GenerateInvoiceInput) {
  // Check if invoice already exists for this tenant and month
  const existing = await prisma.rentInvoice.findFirst({
    where: {
      tenantId: data.tenantId,
      billingMonth: data.billingMonth,
    },
  });

  if (existing) {
    throw new Error("INVOICE_ALREADY_EXISTS");
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: data.tenantId },
  });

  if (!tenant) {
    throw new Error("TENANT_NOT_FOUND");
  }

  const rentAmount = data.rentAmount ?? tenant.monthlyRent;
  const prevBalance = data.previousBalance || 0;
  const lateFee = data.lateFee || 0;
  const utilityCharges = data.utilityCharges || 0;
  const otherCharges = data.otherCharges || 0;
  const discount = data.discount || 0;

  const totalAmount = Math.max(
    0,
    rentAmount + prevBalance + lateFee + utilityCharges + otherCharges - discount
  );

  const [year, month] = data.billingMonth.split("-").map(Number);
  const billingPeriodStart = new Date(year, month - 1, 1);
  const billingPeriodEnd = new Date(year, month, 0);
  const invoiceNumber = `INV-${data.billingMonth}-${Math.floor(1000 + Math.random() * 9000)}`;

  const invoice = await prisma.rentInvoice.create({
    data: {
      invoiceNumber,
      tenantId: data.tenantId,
      propertyId: data.propertyId,
      roomId: tenant.roomId,
      bedId: tenant.bedId,
      billingMonth: data.billingMonth,
      billingPeriodStart,
      billingPeriodEnd,
      dueDate: new Date(data.dueDate),
      rentAmount,
      previousBalance: prevBalance,
      lateFee,
      utilityCharges,
      otherCharges,
      discount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
      status: totalAmount === 0 ? InvoiceStatus.PAID : InvoiceStatus.PENDING,
      notes: data.notes,
    },
  });

  if (tenant.userId) {
    await prisma.notification.create({
      data: {
        userId: tenant.userId,
        title: `Rent Invoice Generated: ${data.billingMonth}`,
        message: `Your rent invoice ${invoiceNumber} for ₹${totalAmount.toLocaleString()} has been generated. Due date: ${data.dueDate}.`,
        type: "RENT_DUE",
        linkUrl: `/portal?tab=dues`,
      },
    });
  }

  await prisma.activityLog.create({
    data: {
      userId: data.currentUserId,
      propertyId: data.propertyId,
      action: "INVOICE_GENERATED",
      entity: "RentInvoice",
      entityId: invoice.id,
      details: `Generated invoice ${invoiceNumber} of ₹${totalAmount} for ${tenant.fullName}`,
    },
  });

  return invoice;
}

export interface RecordPaymentInput {
  tenantId: string;
  propertyId: string;
  invoiceId?: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  notes?: string;
  currentUserId?: string;
}

export async function recordPayment(data: RecordPaymentInput) {
  return await prisma.$transaction(async (tx) => {
    let invoice = null;

    if (data.invoiceId) {
      invoice = await tx.rentInvoice.findUnique({
        where: { id: data.invoiceId },
      });

      if (!invoice) {
        throw new Error("INVOICE_NOT_FOUND");
      }

      if (data.amount > invoice.balanceAmount) {
        throw new Error("PAYMENT_EXCEEDS_BALANCE");
      }
    }

    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = await tx.payment.create({
      data: {
        receiptNumber,
        invoiceId: data.invoiceId || undefined,
        tenantId: data.tenantId,
        propertyId: data.propertyId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
        transactionId: data.transactionId,
        status: PaymentStatus.COMPLETED,
        notes: data.notes,
        receivedById: data.currentUserId,
      },
    });

    if (invoice) {
      const newPaidAmount = invoice.paidAmount + data.amount;
      const newBalanceAmount = Math.max(0, invoice.totalAmount - newPaidAmount);
      const newStatus =
        newBalanceAmount === 0
          ? InvoiceStatus.PAID
          : newPaidAmount > 0
          ? InvoiceStatus.PARTIALLY_PAID
          : invoice.status;

      await tx.rentInvoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: newPaidAmount,
          balanceAmount: newBalanceAmount,
          status: newStatus,
        },
      });
    }

    // Audit log
    await tx.activityLog.create({
      data: {
        userId: data.currentUserId,
        propertyId: data.propertyId,
        action: "PAYMENT_RECORDED",
        entity: "Payment",
        entityId: payment.id,
        details: `Recorded payment of ₹${data.amount} (${receiptNumber}) via ${data.paymentMethod}`,
      },
    });

    return payment;
  });
}
