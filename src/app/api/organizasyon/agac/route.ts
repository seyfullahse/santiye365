import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Organizasyon ağacı: tüm çalışanları hiyerarşik yapıyla döndür
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId") || "";

    const where: Record<string, unknown> = { status: "ACTIVE" };
    if (departmentId) where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        managerId: true,
        departmentId: true,
        positionId: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    const departments = await prisma.department.findMany({
      include: {
        _count: { select: { employees: true, positions: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ employees, departments });
  } catch (error) {
    console.error("GET /api/organizasyon/agac error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
