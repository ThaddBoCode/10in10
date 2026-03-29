import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPin, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, pin } = await request.json();

  if (!name || !pin) {
    return NextResponse.json(
      { error: "Name und PIN sind erforderlich" },
      { status: 400 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { name } });
  if (existing) {
    return NextResponse.json(
      { error: "Dieser Name ist bereits vergeben" },
      { status: 409 }
    );
  }

  const pinHash = await hashPin(pin);
  const user = await prisma.user.create({
    data: { name, pinHash },
    select: { id: true, name: true, height: true, activityLevel: true },
  });

  await prisma.privacySettings.create({
    data: { userId: user.id },
  });

  await prisma.userPreferences.create({
    data: { userId: user.id },
  });

  await setSessionCookie(user.id);

  return NextResponse.json({ user });
}
