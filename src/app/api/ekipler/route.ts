import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const teams = await prisma.team.findMany({
      include: {
        company: { select: { id: true, name: true, sortOrder: true } },
        discipline: { select: { name: true } },
      },
      orderBy: [{ company: { sortOrder: "asc" } }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(teams);
  } catch (error) {
    console.error("Ekipler alınamadı:", error);
    return NextResponse.json({ error: "Ekipler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const team = await prisma.team.create({
      data: {
        companyId: body.companyId,
        name: body.name,
        disciplineId: body.disciplineId,
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(team, { status: 201 });
  } catch (error) {
    console.error("Ekip oluşturulamadı:", error);
    return NextResponse.json({ error: "Ekip oluşturulamadı" }, { status: 500 });
  }
}
