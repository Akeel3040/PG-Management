import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { loginSchema } from "@/lib/validation";
import { logActivity } from "@/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten() },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        tenantProfile: { select: { id: true, propertyId: true } },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Your account is inactive or suspended. Please contact management." },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      assignedPropertyId: user.assignedPropertyId || user.tenantProfile?.propertyId || null,
      tenantId: user.tenantProfile?.id ?? null,
    };

    const token = await createSessionToken(sessionPayload);
    await setSessionCookie(token);

    await logActivity({
      userId: user.id,
      propertyId: user.assignedPropertyId || user.tenantProfile?.propertyId,
      action: "USER_LOGIN",
      entity: "User",
      entityId: user.id,
      details: `User ${user.email} logged in with role ${user.role}`,
    });

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during login" },
      { status: 500 }
    );
  }
}
