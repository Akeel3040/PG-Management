import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const propertySchema = z.object({
  name: z.string().min(2, "Property name is required"),
  code: z.string().min(2, "Property code is required").toUpperCase(),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(4, "Pincode is required"),
  phone: z.string().min(8, "Phone is required"),
  email: z.string().email("Invalid email address"),
  googleMapsUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  rules: z.string().optional().or(z.literal("")),
  totalFloors: z.coerce.number().min(1, "Must have at least 1 floor").default(1),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

export const floorSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  floorNumber: z.coerce.number().min(0, "Floor number must be 0 or greater"),
  floorName: z.string().min(1, "Floor name is required"),
  description: z.string().optional().or(z.literal("")),
});

export const roomSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  floorId: z.string().min(1, "Floor is required"),
  roomNumber: z.string().min(1, "Room number is required"),
  roomType: z.enum(["SINGLE", "DOUBLE_SHARING", "TRIPLE_SHARING", "FOUR_SHARING", "CUSTOM"]).default("DOUBLE_SHARING"),
  capacity: z.coerce.number().min(1).default(2),
  numberOfBeds: z.coerce.number().min(1).default(2),
  hasAc: z.boolean().default(false),
  hasAttachedBathroom: z.boolean().default(true),
  baseRent: z.coerce.number().min(0).default(0),
  securityDeposit: z.coerce.number().min(0).default(0),
  status: z.enum(["AVAILABLE", "FULL", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
});

export const bedSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  roomId: z.string().min(1, "Room is required"),
  bedNumber: z.string().min(1, "Bed number/name is required"),
  monthlyRent: z.coerce.number().min(0, "Rent must be a positive number"),
  securityDeposit: z.coerce.number().min(0).default(0),
  status: z.enum(["AVAILABLE", "OCCUPIED", "RESERVED", "MAINTENANCE", "INACTIVE"]).default("AVAILABLE"),
});

export const tenantOnboardingSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  gender: z.string().min(1, "Gender is required"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  phone: z.string().min(10, "Valid 10-digit phone number is required"),
  whatsapp: z.string().optional().or(z.literal("")),
  email: z.string().email("Valid email is required"),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z.string().min(4, "Pincode is required"),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
  emergencyContactRelation: z.string().min(1, "Relation is required"),
  occupation: z.string().optional().or(z.literal("")),
  companyOrCollege: z.string().optional().or(z.literal("")),
  idType: z.enum(["AADHAAR", "PAN", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "OTHER"]).default("AADHAAR"),
  idNumber: z.string().min(4, "ID number is required"),
  idDocumentUrl: z.string().optional().or(z.literal("")),
  propertyId: z.string().min(1, "Property is required"),
  roomId: z.string().min(1, "Room is required"),
  bedId: z.string().min(1, "Bed is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  expectedLeavingDate: z.string().optional().or(z.literal("")),
  monthlyRent: z.coerce.number().min(0, "Rent must be non-negative"),
  securityDeposit: z.coerce.number().min(0).default(0),
  advanceAmount: z.coerce.number().min(0).default(0),
  noticePeriodDays: z.coerce.number().min(0).default(30),
  agreementStartDate: z.string().optional().or(z.literal("")),
  agreementEndDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const tenantCheckInSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  propertyId: z.string().min(1, "Property is required"),
  roomId: z.string().min(1, "Room is required"),
  bedId: z.string().min(1, "Bed is required"),
  checkInDate: z.string().min(1, "Check-in date is required"),
  rent: z.coerce.number().min(0),
  deposit: z.coerce.number().min(0).default(0),
  advanceAmount: z.coerce.number().min(0).default(0),
  agreementStartDate: z.string().optional().or(z.literal("")),
  agreementEndDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const tenantCheckOutSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  propertyId: z.string().min(1, "Property is required"),
  checkOutDate: z.string().min(1, "Check-out date is required"),
  reason: z.string().optional().or(z.literal("")),
  pendingRentDues: z.coerce.number().min(0).default(0),
  utilityDues: z.coerce.number().min(0).default(0),
  damageCharges: z.coerce.number().min(0).default(0),
  refundableDeposit: z.coerce.number().min(0).default(0),
  finalSettlementAmount: z.coerce.number().default(0),
  settlementStatus: z.enum(["SETTLED", "PENDING"]).default("SETTLED"),
  notes: z.string().optional().or(z.literal("")),
});

export const rentInvoiceSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  propertyId: z.string().min(1, "Property is required"),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  dueDate: z.string().min(1, "Due date is required"),
  rentAmount: z.coerce.number().min(0),
  previousBalance: z.coerce.number().default(0),
  lateFee: z.coerce.number().default(0),
  utilityCharges: z.coerce.number().default(0),
  otherCharges: z.coerce.number().default(0),
  discount: z.coerce.number().default(0),
  notes: z.string().optional().or(z.literal("")),
});

export const paymentSchema = z.object({
  tenantId: z.string().min(1, "Tenant is required"),
  propertyId: z.string().min(1, "Property is required"),
  invoiceId: z.string().optional().or(z.literal("")),
  amount: z.coerce.number().min(1, "Payment amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.enum(["CASH", "UPI", "BANK_TRANSFER", "CARD", "OTHER"]).default("UPI"),
  transactionId: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const expenseSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  category: z.enum([
    "ELECTRICITY", "WATER", "INTERNET", "MAINTENANCE", "STAFF_SALARY",
    "CLEANING", "SECURITY", "REPAIRS", "GROCERY", "FURNITURE", "PROPERTY_RENT", "OTHER"
  ]).default("MAINTENANCE"),
  amount: z.coerce.number().min(1, "Amount must be greater than 0"),
  date: z.string().min(1, "Date is required"),
  vendor: z.string().optional().or(z.literal("")),
  description: z.string().min(2, "Description is required"),
  receiptUrl: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const complaintSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  category: z.enum([
    "ELECTRICITY", "PLUMBING", "INTERNET", "CLEANING", "FOOD", "ROOM", "SECURITY", "MAINTENANCE", "OTHER"
  ]).default("MAINTENANCE"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  imageUrl: z.string().optional().or(z.literal("")),
});

export const complaintUpdateSchema = z.object({
  status: z.enum(["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedStaffId: z.string().optional().or(z.literal("")),
  resolutionNotes: z.string().optional().or(z.literal("")),
});

export const visitorSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  tenantId: z.string().min(1, "Tenant is required"),
  visitorName: z.string().min(2, "Visitor name is required"),
  phone: z.string().min(10, "Phone number is required"),
  purpose: z.string().min(2, "Purpose is required"),
  idType: z.string().optional().or(z.literal("")),
  idNumber: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export const staffSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(2, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  role: z.enum(["MANAGER", "ACCOUNTANT", "SECURITY", "CLEANER", "MAINTENANCE", "COOK", "OTHER"]).default("MAINTENANCE"),
  salary: z.coerce.number().min(0).default(0),
  joiningDate: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export const noticeSchema = z.object({
  propertyId: z.string().optional().or(z.literal("")),
  title: z.string().min(3, "Title is required"),
  content: z.string().min(5, "Content is required"),
  targetAudience: z.enum(["ALL_TENANTS", "PROPERTY_SPECIFIC", "ROOM_SPECIFIC", "TENANT_SPECIFIC"]).default("ALL_TENANTS"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  expiryDate: z.string().optional().or(z.literal("")),
  status: z.enum(["PUBLISHED", "DRAFT", "EXPIRED"]).default("PUBLISHED"),
});

export const utilityReadingSchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  roomId: z.string().optional().or(z.literal("")),
  utilityType: z.enum(["ELECTRICITY", "WATER"]).default("ELECTRICITY"),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/, "Format must be YYYY-MM"),
  previousReading: z.coerce.number().min(0),
  currentReading: z.coerce.number().min(0),
  perUnitRate: z.coerce.number().min(0),
  isShared: z.boolean().default(false),
});
