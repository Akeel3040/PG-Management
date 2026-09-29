import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword, createSessionToken, verifySessionToken } from "../lib/auth";
import { hasPermission, canAccessProperty } from "../lib/permissions";
import { UserRole } from "@prisma/client";

describe("Authentication & RBAC Security", () => {
  it("should securely hash and verify passwords using bcrypt", async () => {
    const password = "mySecretPassword123";
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    expect(hashed.length).toBeGreaterThan(20);

    const isMatch = await comparePassword(password, hashed);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword("wrongPassword", hashed);
    expect(isWrongMatch).toBe(false);
  });

  it("should generate and verify JWT session tokens", async () => {
    const userPayload = {
      id: "usr_123",
      email: "test@pgmanagement.com",
      name: "Test User",
      role: UserRole.OWNER,
      assignedPropertyId: "prop_1",
      tenantId: null,
    };

    const token = await createSessionToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(userPayload.id);
    expect(decoded?.role).toBe(UserRole.OWNER);
  });

  it("should reject invalid JWT tokens", async () => {
    const invalidToken = "invalid.jwt.token.string";
    const decoded = await verifySessionToken(invalidToken);
    expect(decoded).toBeNull();
  });

  it("should enforce correct permissions for each role", () => {
    // Owner can access property, rent, and staff
    expect(hasPermission(UserRole.OWNER, "property:delete")).toBe(true);
    expect(hasPermission(UserRole.OWNER, "rent:generate")).toBe(true);
    expect(hasPermission(UserRole.OWNER, "staff:manage")).toBe(true);

    // Manager can manage tenants, rooms, complaints but NOT delete properties or manage staff salaries
    expect(hasPermission(UserRole.MANAGER, "tenant:create")).toBe(true);
    expect(hasPermission(UserRole.MANAGER, "complaint:manage")).toBe(true);
    expect(hasPermission(UserRole.MANAGER, "property:delete")).toBe(false);

    // Accountant can manage rent, payments, expenses but NOT check in tenants
    expect(hasPermission(UserRole.ACCOUNTANT, "rent:generate")).toBe(true);
    expect(hasPermission(UserRole.ACCOUNTANT, "payment:create")).toBe(true);
    expect(hasPermission(UserRole.ACCOUNTANT, "tenant:checkin")).toBe(false);

    // Staff can manage complaints but NOT generate rent
    expect(hasPermission(UserRole.STAFF, "complaint:manage")).toBe(true);
    expect(hasPermission(UserRole.STAFF, "rent:generate")).toBe(false);

    // Tenant can only lodge complaints, not view financial reports
    expect(hasPermission(UserRole.TENANT, "complaint:create")).toBe(true);
    expect(hasPermission(UserRole.TENANT, "rent:generate")).toBe(false);
    expect(hasPermission(UserRole.TENANT, "report:view")).toBe(false);
  });

  it("should enforce property isolation for manager vs owner", () => {
    const ownerAccess = canAccessProperty(UserRole.OWNER, null, "prop_1");
    expect(ownerAccess).toBe(true);

    const managerAccessAssigned = canAccessProperty(UserRole.MANAGER, "prop_1", "prop_1");
    expect(managerAccessAssigned).toBe(true);

    const managerAccessUnassigned = canAccessProperty(UserRole.MANAGER, "prop_1", "prop_2");
    expect(managerAccessUnassigned).toBe(false);
  });
});
