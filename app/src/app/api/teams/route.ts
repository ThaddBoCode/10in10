import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// Create a new team
export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { name, targetKg, weeks } = await request.json();

  if (!name || !targetKg || !weeks) {
    return NextResponse.json({ error: "Name, Ziel und Zeitraum sind erforderlich" }, { status: 400 });
  }

  // Generate unique invite code
  let inviteCode = generateInviteCode();
  while (await prisma.team.findUnique({ where: { inviteCode } })) {
    inviteCode = generateInviteCode();
  }

  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + weeks * 7);

  const team = await prisma.team.create({
    data: {
      name,
      inviteCode,
      targetKg,
      startDate,
      endDate,
      weeks,
      createdById: userId,
      members: {
        create: { userId, role: "admin" },
      },
    },
    include: { members: { include: { user: { select: { id: true, name: true } } } } },
  });

  return NextResponse.json({ team });
}

// Get my teams
export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      team: {
        include: {
          members: {
            include: { user: { select: { id: true, name: true } } },
          },
          createdBy: { select: { name: true } },
        },
      },
    },
  });

  const teams = memberships.map((m) => ({
    ...m.team,
    myRole: m.role,
  }));

  return NextResponse.json({ teams });
}
