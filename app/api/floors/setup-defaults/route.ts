import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function getFloorName(floorNumber: number) {
  const lastTwoDigits = floorNumber % 100;
  const suffix = lastTwoDigits >= 11 && lastTwoDigits <= 13
    ? "th"
    : floorNumber % 10 === 1
      ? "st"
      : floorNumber % 10 === 2
        ? "nd"
        : floorNumber % 10 === 3
          ? "rd"
          : "th";

  return `${floorNumber}${suffix} Floor`;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "OWNER" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const propertyId = typeof body.propertyId === "string" ? body.propertyId : "";
    if (!propertyId) {
      return NextResponse.json({ error: "Property is required" }, { status: 400 });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, totalFloors: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (user.role === "OWNER" && property.ownerId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const floorCount = Math.max(5, property.totalFloors);
    const floors = await prisma.$transaction(async (transaction) => {
      const existing = await transaction.floor.findMany({
        where: { propertyId },
        select: { floorNumber: true },
      });
      const existingNumbers = new Set(existing.map((floor) => floor.floorNumber));
      const missingFloors = Array.from({ length: floorCount }, (_, index) => index + 1)
        .filter((floorNumber) => !existingNumbers.has(floorNumber))
        .map((floorNumber) => ({
          propertyId,
          floorNumber,
          floorName: getFloorName(floorNumber),
        }));

      if (missingFloors.length) {
        await transaction.floor.createMany({ data: missingFloors, skipDuplicates: true });
      }
      if (property.totalFloors < floorCount) {
        await transaction.property.update({
          where: { id: propertyId },
          data: { totalFloors: floorCount },
        });
      }

      return transaction.floor.findMany({
        where: { propertyId },
        orderBy: { floorNumber: "asc" },
      });
    });

    return NextResponse.json({ success: true, floors });
  } catch (error) {
    console.error("Set up default floors error:", error);
    return NextResponse.json({ error: "Could not set up floors" }, { status: 500 });
  }
}