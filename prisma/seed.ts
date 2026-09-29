import { PrismaClient, UserRole, BedStatus, RoomStatus, TenantStatus, InvoiceStatus, PaymentMethod, PaymentStatus, ComplaintStatus, ComplaintPriority, ExpenseCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PG Management System Database...");

  // Clean existing data
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.utilityReading.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rentInvoice.deleteMany();
  await prisma.tenantAgreement.deleteMany();
  await prisma.tenantDocument.deleteMany();
  await prisma.tenantCheckOut.deleteMany();
  await prisma.tenantCheckIn.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.propertyAmenity.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.notice.deleteMany();
  await prisma.setting.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 1. Create Super Admin & Owner
  const superAdmin = await prisma.user.create({
    data: {
      email: "admin@pgmanagement.com",
      password: hashedPassword,
      name: "Rajesh Sharma (Admin)",
      phone: "+91 98765 43210",
      role: UserRole.SUPER_ADMIN,
    },
  });

  const owner = await prisma.user.create({
    data: {
      email: "owner@pgmanagement.com",
      password: hashedPassword,
      name: "Vikram Malhotra (Owner)",
      phone: "+91 98111 22334",
      role: UserRole.OWNER,
    },
  });

  // 2. Create Properties
  const propertyA = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Sunrise Luxury Living PG",
      code: "SUN-KOR-01",
      address: "128, 4th Cross, 5th Block, Koramangala",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560095",
      phone: "+91 80 2553 1199",
      email: "info@sunrisepg.com",
      googleMapsUrl: "https://maps.google.com/?q=Koramangala+Bangalore",
      description: "Premium co-living PG with high-speed fiber Wi-Fi, 3 times hygienic food, biometric entry, daily housekeeping, and power backup.",
      rules: "1. Gate closes at 11:00 PM.\n2. Non-resident visitors allowed until 8:00 PM only.\n3. Smoking and alcohol strictly prohibited on premises.\n4. Maintain silence in corridors after 10:00 PM.",
      totalFloors: 3,
      totalRooms: 6,
      totalBeds: 12,
      status: "ACTIVE",
    },
  });

  const propertyB = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: "Grand Horizon Executive PG",
      code: "HOR-HSR-02",
      address: "84, 14th Main, Sector 4, HSR Layout",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560102",
      phone: "+91 80 4112 3388",
      email: "hsr@grandhorizon.com",
      googleMapsUrl: "https://maps.google.com/?q=HSR+Layout+Bangalore",
      description: "Executive stay PG for working professionals and tech employees near Outer Ring Road.",
      rules: "1. Biometric access card required at all times.\n2. Visitors must register at security desk.\n3. Monthly rent due by 5th of every month.",
      totalFloors: 2,
      totalRooms: 4,
      totalBeds: 8,
      status: "ACTIVE",
    },
  });

  // Property Amenities
  const amenities = [
    { name: "High-Speed Wi-Fi (300 Mbps)", icon: "Wifi", isFree: true },
    { name: "3-Time North & South Food", icon: "Utensils", isFree: true },
    { name: "24/7 Power Backup", icon: "Zap", isFree: true },
    { name: "Daily Room Housekeeping", icon: "Sparkles", isFree: true },
    { name: "Washing Machine & Laundry Area", icon: "Shirt", isFree: true },
    { name: "CCTV Surveillance & Biometric", icon: "ShieldCheck", isFree: true },
  ];

  for (const amen of amenities) {
    await prisma.propertyAmenity.create({
      data: {
        propertyId: propertyA.id,
        name: amen.name,
        icon: amen.icon,
        isFree: amen.isFree,
      },
    });
  }

  // 3. Create Manager, Accountant, Staff users
  const managerUser = await prisma.user.create({
    data: {
      email: "manager@pgmanagement.com",
      password: hashedPassword,
      name: "Arun Kumar (Manager)",
      phone: "+91 98222 33445",
      role: UserRole.MANAGER,
      assignedPropertyId: propertyA.id,
    },
  });

  const accountantUser = await prisma.user.create({
    data: {
      email: "accountant@pgmanagement.com",
      password: hashedPassword,
      name: "Priya Nair (Accountant)",
      phone: "+91 98333 44556",
      role: UserRole.ACCOUNTANT,
      assignedPropertyId: propertyA.id,
    },
  });

  const staffUser = await prisma.user.create({
    data: {
      email: "staff@pgmanagement.com",
      password: hashedPassword,
      name: "Ramesh Yadav (Maintenance Staff)",
      phone: "+91 98444 55667",
      role: UserRole.STAFF,
      assignedPropertyId: propertyA.id,
    },
  });

  // Staff profile records
  await prisma.staff.create({
    data: {
      propertyId: propertyA.id,
      userId: managerUser.id,
      name: "Arun Kumar",
      phone: "+91 98222 33445",
      email: "manager@pgmanagement.com",
      role: "MANAGER",
      salary: 35000,
      joiningDate: new Date("2024-01-15"),
      address: "Koramangala 1st Block, Bengaluru",
      emergencyContact: "+91 98222 00000 (Spouse)",
      status: "ACTIVE",
    },
  });

  const maintenanceStaff = await prisma.staff.create({
    data: {
      propertyId: propertyA.id,
      userId: staffUser.id,
      name: "Ramesh Yadav",
      phone: "+91 98444 55667",
      email: "staff@pgmanagement.com",
      role: "MAINTENANCE",
      salary: 18000,
      joiningDate: new Date("2024-02-01"),
      address: "Ejipura, Bengaluru",
      emergencyContact: "+91 98444 11111 (Brother)",
      status: "ACTIVE",
    },
  });

  // 4. Create Floors, Rooms, and Beds for Property A
  const floor1 = await prisma.floor.create({
    data: {
      propertyId: propertyA.id,
      floorNumber: 1,
      floorName: "1st Floor",
      description: "Quiet floor, double sharing deluxe rooms with balcony",
    },
  });

  const floor2 = await prisma.floor.create({
    data: {
      propertyId: propertyA.id,
      floorNumber: 2,
      floorName: "2nd Floor",
      description: "Standard double and single rooms",
    },
  });

  // Rooms
  const room101 = await prisma.room.create({
    data: {
      propertyId: propertyA.id,
      floorId: floor1.id,
      roomNumber: "101",
      roomType: "DOUBLE_SHARING",
      capacity: 2,
      numberOfBeds: 2,
      hasAc: true,
      hasAttachedBathroom: true,
      baseRent: 11000,
      securityDeposit: 22000,
      status: RoomStatus.AVAILABLE,
    },
  });

  const room102 = await prisma.room.create({
    data: {
      propertyId: propertyA.id,
      floorId: floor1.id,
      roomNumber: "102",
      roomType: "SINGLE",
      capacity: 1,
      numberOfBeds: 1,
      hasAc: true,
      hasAttachedBathroom: true,
      baseRent: 18000,
      securityDeposit: 36000,
      status: RoomStatus.AVAILABLE,
    },
  });

  const room201 = await prisma.room.create({
    data: {
      propertyId: propertyA.id,
      floorId: floor2.id,
      roomNumber: "201",
      roomType: "DOUBLE_SHARING",
      capacity: 2,
      numberOfBeds: 2,
      hasAc: false,
      hasAttachedBathroom: true,
      baseRent: 9500,
      securityDeposit: 19000,
      status: RoomStatus.AVAILABLE,
    },
  });

  const room202 = await prisma.room.create({
    data: {
      propertyId: propertyA.id,
      floorId: floor2.id,
      roomNumber: "202",
      roomType: "TRIPLE_SHARING",
      capacity: 3,
      numberOfBeds: 3,
      hasAc: false,
      hasAttachedBathroom: true,
      baseRent: 8000,
      securityDeposit: 16000,
      status: RoomStatus.AVAILABLE,
    },
  });

  // Beds for Room 101
  const bed101A = await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room101.id,
      bedNumber: "101-A",
      monthlyRent: 11000,
      securityDeposit: 22000,
      status: BedStatus.OCCUPIED,
    },
  });

  const bed101B = await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room101.id,
      bedNumber: "101-B",
      monthlyRent: 11000,
      securityDeposit: 22000,
      status: BedStatus.OCCUPIED,
    },
  });

  // Bed for Room 102
  const bed102A = await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room102.id,
      bedNumber: "102-Single",
      monthlyRent: 18000,
      securityDeposit: 36000,
      status: BedStatus.AVAILABLE,
    },
  });

  // Beds for Room 201
  const bed201A = await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room201.id,
      bedNumber: "201-A",
      monthlyRent: 9500,
      securityDeposit: 19000,
      status: BedStatus.AVAILABLE,
    },
  });

  const bed201B = await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room201.id,
      bedNumber: "201-B",
      monthlyRent: 9500,
      securityDeposit: 19000,
      status: BedStatus.RESERVED,
    },
  });

  // Beds for Room 202
  await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room202.id,
      bedNumber: "202-A",
      monthlyRent: 8000,
      securityDeposit: 16000,
      status: BedStatus.AVAILABLE,
    },
  });
  await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room202.id,
      bedNumber: "202-B",
      monthlyRent: 8000,
      securityDeposit: 16000,
      status: BedStatus.MAINTENANCE,
    },
  });
  await prisma.bed.create({
    data: {
      propertyId: propertyA.id,
      roomId: room202.id,
      bedNumber: "202-C",
      monthlyRent: 8000,
      securityDeposit: 16000,
      status: BedStatus.AVAILABLE,
    },
  });

  // 5. Create Tenants
  // Tenant 1 (Linked to user login)
  const tenantUser1 = await prisma.user.create({
    data: {
      email: "tenant@pgmanagement.com",
      password: hashedPassword,
      name: "Aditya Verma",
      phone: "+91 99887 76655",
      role: UserRole.TENANT,
    },
  });

  const tenant1 = await prisma.tenant.create({
    data: {
      userId: tenantUser1.id,
      propertyId: propertyA.id,
      roomId: room101.id,
      bedId: bed101A.id,
      fullName: "Aditya Verma",
      gender: "Male",
      dateOfBirth: new Date("1998-05-14"),
      phone: "+91 99887 76655",
      whatsapp: "+91 99887 76655",
      email: "tenant@pgmanagement.com",
      address: "House 45, Civil Lines",
      city: "Jaipur",
      state: "Rajasthan",
      pincode: "302006",
      emergencyContactName: "Mahesh Verma",
      emergencyContactPhone: "+91 94140 12345",
      emergencyContactRelation: "Father",
      occupation: "Software Engineer",
      companyOrCollege: "Infosys Ltd.",
      idType: "AADHAAR",
      idNumber: "9876-5432-1098",
      joiningDate: new Date("2024-03-01"),
      monthlyRent: 11000,
      securityDeposit: 22000,
      advanceAmount: 11000,
      status: TenantStatus.ACTIVE,
      notes: "Quiet and punctual tenant. Works in night shifts occasionally.",
    },
  });

  // Tenant 2
  const tenant2 = await prisma.tenant.create({
    data: {
      propertyId: propertyA.id,
      roomId: room101.id,
      bedId: bed101B.id,
      fullName: "Rohan Kulkarni",
      gender: "Male",
      dateOfBirth: new Date("2000-11-20"),
      phone: "+91 97654 32109",
      whatsapp: "+91 97654 32109",
      email: "rohan.kulkarni@gmail.com",
      address: "Plot 12, Shivaji Nagar",
      city: "Pune",
      state: "Maharashtra",
      pincode: "411005",
      emergencyContactName: "Sunita Kulkarni",
      emergencyContactPhone: "+91 98220 98765",
      emergencyContactRelation: "Mother",
      occupation: "Product Designer",
      companyOrCollege: "Swiggy",
      idType: "PAN",
      idNumber: "ABCDE1234F",
      joiningDate: new Date("2024-04-10"),
      monthlyRent: 11000,
      securityDeposit: 22000,
      advanceAmount: 0,
      status: TenantStatus.ACTIVE,
    },
  });

  // Tenant Documents
  await prisma.tenantDocument.create({
    data: {
      tenantId: tenant1.id,
      title: "Aditya Verma Aadhaar Card",
      documentType: "AADHAAR",
      fileUrl: "/sample-docs/aadhaar.pdf",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date("2024-03-02"),
      verifiedBy: managerUser.name,
    },
  });

  // Tenant Agreement
  await prisma.tenantAgreement.create({
    data: {
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      roomId: room101.id,
      bedId: bed101A.id,
      agreementNumber: "AGR-2024-001",
      startDate: new Date("2024-03-01"),
      endDate: new Date("2025-02-28"),
      monthlyRent: 11000,
      securityDeposit: 22000,
      noticePeriodDays: 30,
      rules: propertyA.rules,
      status: "ACTIVE",
    },
  });

  // Tenant Check-in record
  await prisma.tenantCheckIn.create({
    data: {
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      roomId: room101.id,
      bedId: bed101A.id,
      checkInDate: new Date("2024-03-01"),
      rent: 11000,
      deposit: 22000,
      advanceAmount: 11000,
      agreementStartDate: new Date("2024-03-01"),
      agreementEndDate: new Date("2025-02-28"),
      notes: "Checked in with 1 suitcase and 1 laptop bag. Bed 101-A allocated.",
    },
  });

  // 6. Invoices & Payments for Tenant 1
  const invoice1 = await prisma.rentInvoice.create({
    data: {
      invoiceNumber: "INV-2024-08-001",
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      roomId: room101.id,
      bedId: bed101A.id,
      billingMonth: "2024-08",
      billingPeriodStart: new Date("2024-08-01"),
      billingPeriodEnd: new Date("2024-08-31"),
      dueDate: new Date("2024-08-05"),
      rentAmount: 11000,
      utilityCharges: 500,
      totalAmount: 11500,
      paidAmount: 11500,
      balanceAmount: 0,
      status: InvoiceStatus.PAID,
      notes: "August 2024 rent and electricity charges paid on time.",
    },
  });

  await prisma.payment.create({
    data: {
      receiptNumber: "REC-2024-08-101",
      invoiceId: invoice1.id,
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      amount: 11500,
      paymentDate: new Date("2024-08-03"),
      paymentMethod: PaymentMethod.UPI,
      transactionId: "UPI423891002341",
      status: PaymentStatus.COMPLETED,
      receivedById: accountantUser.id,
      notes: "UPI payment received via PhonePe QR.",
    },
  });

  // September Invoice (Pending / Overdue)
  const invoice2 = await prisma.rentInvoice.create({
    data: {
      invoiceNumber: "INV-2024-09-001",
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      roomId: room101.id,
      bedId: bed101A.id,
      billingMonth: "2024-09",
      billingPeriodStart: new Date("2024-09-01"),
      billingPeriodEnd: new Date("2024-09-30"),
      dueDate: new Date("2024-09-05"),
      rentAmount: 11000,
      utilityCharges: 600,
      lateFee: 200,
      totalAmount: 11800,
      paidAmount: 5000,
      balanceAmount: 6800,
      status: InvoiceStatus.PARTIALLY_PAID,
      notes: "Partial payment of ₹5,000 received. Balance ₹6,800 pending.",
    },
  });

  await prisma.payment.create({
    data: {
      receiptNumber: "REC-2024-09-002",
      invoiceId: invoice2.id,
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      amount: 5000,
      paymentDate: new Date("2024-09-04"),
      paymentMethod: PaymentMethod.UPI,
      transactionId: "UPI425110992384",
      status: PaymentStatus.COMPLETED,
      receivedById: accountantUser.id,
      notes: "Partial payment of ₹5000 via Google Pay.",
    },
  });

  // 7. Expenses
  await prisma.expense.create({
    data: {
      propertyId: propertyA.id,
      category: ExpenseCategory.ELECTRICITY,
      amount: 14250,
      date: new Date("2024-08-10"),
      vendor: "BESCOM (Bangalore Electricity Supply)",
      description: "Monthly electricity bill for meter #8839201",
      receiptUrl: "/sample-docs/bescom-bill.pdf",
      paidById: accountantUser.id,
      notes: "Online bill payment through BESCOM portal.",
    },
  });

  await prisma.expense.create({
    data: {
      propertyId: propertyA.id,
      category: ExpenseCategory.GROCERY,
      amount: 32000,
      date: new Date("2024-08-15"),
      vendor: "Metro Cash & Carry",
      description: "Bulk groceries, rice, pulses, cooking oil and spices for PG kitchen",
      receiptUrl: "/sample-docs/metro-receipt.pdf",
      paidById: managerUser.id,
      notes: "Monthly ration for 25 residents.",
    },
  });

  await prisma.expense.create({
    data: {
      propertyId: propertyA.id,
      category: ExpenseCategory.INTERNET,
      amount: 4500,
      date: new Date("2024-08-05"),
      vendor: "ACT Fibernet",
      description: "Commercial broadband 300 Mbps unlimited plan",
      receiptUrl: "/sample-docs/act-receipt.pdf",
      paidById: accountantUser.id,
    },
  });

  await prisma.expense.create({
    data: {
      propertyId: propertyA.id,
      category: ExpenseCategory.STAFF_SALARY,
      amount: 18000,
      date: new Date("2024-08-01"),
      vendor: "Ramesh Yadav",
      description: "August salary for housekeeping and maintenance staff",
      paidById: owner.id,
    },
  });

  // 8. Complaints
  await prisma.complaint.create({
    data: {
      ticketNumber: "CMP-2024-001",
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      category: "PLUMBING",
      title: "Bathroom tap leaking in Room 101",
      description: "The hot water tap in the attached bathroom is dripping continuously.",
      priority: ComplaintPriority.MEDIUM,
      status: ComplaintStatus.RESOLVED,
      assignedStaffId: maintenanceStaff.id,
      resolutionNotes: "Replaced the washer in the tap fixture. Tested and verified no leaks.",
      resolvedAt: new Date("2024-08-18"),
    },
  });

  await prisma.complaint.create({
    data: {
      ticketNumber: "CMP-2024-002",
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      category: "INTERNET",
      title: "Wi-Fi speed slow on 1st Floor",
      description: "Experiencing frequent packet drops and buffering during video calls on 1st floor access point.",
      priority: ComplaintPriority.HIGH,
      status: ComplaintStatus.IN_PROGRESS,
      assignedStaffId: maintenanceStaff.id,
      resolutionNotes: "Contacted ACT engineer. Router firmware being updated.",
    },
  });

  // 9. Visitors
  await prisma.visitor.create({
    data: {
      tenantId: tenant1.id,
      propertyId: propertyA.id,
      visitorName: "Kunal Bansal",
      phone: "+91 99112 23344",
      purpose: "Friend visiting for project discussion",
      checkInTime: new Date("2024-09-05T14:30:00Z"),
      checkOutTime: new Date("2024-09-05T18:00:00Z"),
      idType: "AADHAAR",
      idNumber: "1234-5678-9012",
      notes: "Checked in at reception desk.",
    },
  });

  // 10. Notices
  await prisma.notice.create({
    data: {
      propertyId: propertyA.id,
      title: "Scheduled Water Tank Cleaning & Maintenance",
      content: "Please be informed that the overhead water tanks will be sanitized and cleaned on Sunday between 10:00 AM and 2:00 PM. Water supply will be paused during this duration. Please store adequate water beforehand.",
      targetAudience: "ALL_TENANTS",
      priority: "HIGH",
      publishDate: new Date("2024-09-01"),
      status: "PUBLISHED",
    },
  });

  await prisma.notice.create({
    data: {
      propertyId: null, // All properties
      title: "Festive Dinner Celebration: Ganesh Chaturthi Special",
      content: "A grand festive feast with traditional delicacies will be served in the dining hall on Friday evening from 7:30 PM onwards. All tenants are cordially invited!",
      targetAudience: "ALL_TENANTS",
      priority: "MEDIUM",
      publishDate: new Date("2024-09-04"),
      status: "PUBLISHED",
    },
  });

  // 11. Notifications
  await prisma.notification.create({
    data: {
      userId: tenantUser1.id,
      title: "September Rent Invoice Generated",
      message: "Your rent invoice for September 2024 (INV-2024-09-001) of ₹11,800 is due. Please clear before due date.",
      type: "RENT_DUE",
      linkUrl: "/portal/rent",
    },
  });

  await prisma.notification.create({
    data: {
      userId: owner.id,
      title: "Partial Payment Received",
      message: "Aditya Verma made a payment of ₹5,000 for Invoice INV-2024-09-001.",
      type: "PAYMENT_RECEIVED",
      linkUrl: "/dashboard/payments",
    },
  });

  // 12. Activity Logs
  await prisma.activityLog.create({
    data: {
      userId: owner.id,
      propertyId: propertyA.id,
      action: "PROPERTY_CREATED",
      entity: "Property",
      entityId: propertyA.id,
      details: "Created Sunrise Luxury Living PG with 2 floors, 4 rooms, 8 beds.",
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: managerUser.id,
      propertyId: propertyA.id,
      action: "TENANT_CHECK_IN",
      entity: "Tenant",
      entityId: tenant1.id,
      details: "Checked in Aditya Verma into Room 101, Bed 101-A.",
    },
  });

  // 13. System & Property Settings
  await prisma.setting.create({
    data: {
      propertyId: null,
      key: "SYSTEM_CURRENCY",
      value: "INR",
    },
  });

  await prisma.setting.create({
    data: {
      propertyId: propertyA.id,
      key: "LATE_FEE_PER_DAY",
      value: "100",
    },
  });

  await prisma.setting.create({
    data: {
      propertyId: propertyA.id,
      key: "RENT_DUE_DAY",
      value: "5",
    },
  });

  console.log("✅ Seeding completed successfully!");
  console.log("-----------------------------------------");
  console.log("Demo Accounts Created:");
  console.log("Super Admin: admin@pgmanagement.com      | password123");
  console.log("Owner:       owner@pgmanagement.com      | password123");
  console.log("Manager:     manager@pgmanagement.com    | password123");
  console.log("Accountant:  accountant@pgmanagement.com | password123");
  console.log("Staff:       staff@pgmanagement.com      | password123");
  console.log("Tenant:      tenant@pgmanagement.com     | password123");
  console.log("-----------------------------------------");
}

main()
  .catch((e) => {
    console.error("Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
