import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const { code } = await request.json();

  if (!code) {
    return NextResponse.json({ error: "Einladungscode erforderlich" }, { status: 400 });
  }

  const team = await prisma.team.findUnique({
    where: { inviteCode: code.toUpperCase().trim() },
    include: { members: true },
  });

  if (!team) {
    return NextResponse.json({ error: "Team nicht gefunden" }, { status: 404 });
  }

  // Check if already a member
  const existing = team.members.find((m) => m.userId === userId);
  if (existing) {
    return NextResponse.json({ error: "Du bist bereits Mitglied" }, { status: 409 });
  }

  await prisma.teamMember.create({
    data: { teamId: team.id, userId, role: "member" },
  });

  return NextResponse.json({ team: { id: team.id, name: team.name } });
}
