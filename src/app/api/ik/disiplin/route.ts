import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "";
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const records = await prisma.disciplineRecord.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(records);
  } catch (error) {
    console.error("GET /api/ik/disiplin error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await prisma.disciplineRecord.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        date: new Date(body.date),
        description: body.description,
        action: body.action || null,
        notes: body.notes || null,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error("POST /api/ik/disiplin error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
