import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET() {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const photos = await prisma.progressPhoto.findMany({
    where: { userId },
    orderBy: { weekNumber: "asc" },
  });

  return NextResponse.json({ photos });
}

export async function POST(request: Request) {
  const userId = await getSession();
  if (!userId) return NextResponse.json({ error: "Nicht angemeldet" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;
  const weekNumber = parseInt(formData.get("weekNumber") as string);

  if (!file || !weekNumber) {
    return NextResponse.json({ error: "Foto und Woche erforderlich" }, { status: 400 });
  }

  // Save file
  const uploadDir = path.resolve(process.cwd(), "public", "uploads", userId);
  await mkdir(uploadDir, { recursive: true });

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `week-${weekNumber}.${ext}`;
  const filePath = path.join(uploadDir, fileName);
  const bytes = new Uint8Array(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  const photoPath = `/uploads/${userId}/${fileName}`;

  // Upsert photo entry
  const existing = await prisma.progressPhoto.findFirst({
    where: { userId, weekNumber },
  });

  if (existing) {
    await prisma.progressPhoto.update({
      where: { id: existing.id },
      data: { photoPath },
    });
  } else {
    await prisma.progressPhoto.create({
      data: { userId, weekNumber, photoPath },
    });
  }

  return NextResponse.json({ photoPath });
}
