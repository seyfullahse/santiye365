import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { employees: true, positions: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(departments);
  } catch (error) {
    console.error("GET /api/ik/departmanlar error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const department = await prisma.department.create({
      data: { name: body.name, sortOrder: body.sortOrder || 0 },
    });
    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error("POST /api/ik/departmanlar error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
