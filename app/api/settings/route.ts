import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const propertyId = searchParams.get("propertyId");

    const settings = await prisma.setting.findMany({
      where: {
        OR: [{ propertyId: propertyId || null }, { propertyId: null }],
      },
    });

    const settingsMap: Record<string, string> = {};
    for (const s of settings) {
      settingsMap[s.key] = s.value;
    }

    return NextResponse.json(settingsMap);
  } catch (error: any) {
    console.error("Fetch settings error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { propertyId, settings } = body;

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings map required" }, { status: 400 });
    }

    for (const [key, value] of Object.entries(settings)) {
      await prisma.setting.upsert({
        where: {
          propertyId_key: {
            propertyId: propertyId || null,
            key,
          },
        },
        update: { value: String(value) },
        create: {
          propertyId: propertyId || null,
          key,
          value: String(value),
        },
      });
    }

    await logActivity({
      userId: user.id,
      propertyId,
      action: "SETTINGS_UPDATED",
      entity: "Setting",
      details: `Updated settings: ${Object.keys(settings).join(", ")}`,
    });

    return NextResponse.json({ success: true, message: "Settings updated successfully" });
  } catch (error: any) {
    console.error("Update settings error:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
