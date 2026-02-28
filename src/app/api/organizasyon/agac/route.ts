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

// PATCH — Yönetici ataması güncelle (sürükle-bırak + dropdown)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, managerId } = body as { employeeId: string; managerId: string | null };

    if (!employeeId) {
      return NextResponse.json({ error: "employeeId gerekli" }, { status: 400 });
    }

    // Kendisine atama yapılamaz
    if (managerId && managerId === employeeId) {
      return NextResponse.json({ error: "Bir kişi kendisinin yöneticisi olamaz" }, { status: 400 });
    }

    // Döngüsel bağlantı kontrolü: managerId'nin üst zincirinde employeeId var mı?
    if (managerId) {
      const allEmployees = await prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, managerId: true },
      });
      const empMap = new Map(allEmployees.map((e) => [e.id, e.managerId]));

      let current: string | null = managerId;
      const visited = new Set<string>();
      while (current) {
        if (current === employeeId) {
          return NextResponse.json(
            { error: "Döngüsel bağlantı oluşur. Bu kişi hedef yöneticinin üst zincirinde." },
            { status: 400 }
          );
        }
        if (visited.has(current)) break;
        visited.add(current);
        current = empMap.get(current) ?? null;
      }
    }

    const updated = await prisma.employee.update({
      where: { id: employeeId },
      data: { managerId: managerId || null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        managerId: true,
        manager: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH /api/organizasyon/agac error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}
