import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPin, setSessionCookie } from "@/lib/auth";

export async function POST(request: Request) {
  const { name, pin } = await request.json();

  if (!name || !pin) {
    return NextResponse.json(
      { error: "Name und PIN sind erforderlich" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { name } });
  if (!user) {
    return NextResponse.json(
      { error: "Nutzer nicht gefunden" },
      { status: 401 }
    );
  }

  const valid = await verifyPin(pin, user.pinHash);
  if (!valid) {
    return NextResponse.json(
      { error: "Falscher PIN" },
      { status: 401 }
    );
  }

  await setSessionCookie(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      height: user.height,
      activityLevel: user.activityLevel,
    },
  });
}
