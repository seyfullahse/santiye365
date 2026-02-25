import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || "";

    const where: Record<string, unknown> = {};
    if (departmentId) where.departmentId = departmentId;

    const positions = await prisma.position.findMany({
      where,
      include: {
        department: { select: { id: true, name: true } },
        _count: { select: { employees: true } },
      },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(positions);
  } catch (error) {
    console.error("GET /api/ik/pozisyonlar error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const position = await prisma.position.create({
      data: {
        name: body.name,
        departmentId: body.departmentId,
        sortOrder: body.sortOrder || 0,
      },
      include: { department: { select: { id: true, name: true } } },
    });
    return NextResponse.json(position, { status: 201 });
  } catch (error) {
    console.error("POST /api/ik/pozisyonlar error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
