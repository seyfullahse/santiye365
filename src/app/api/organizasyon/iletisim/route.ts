import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — İletişim dizini: aranabilir personel listesi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const departmentId = searchParams.get("departmentId") || "";

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { employeeNo: { contains: search } },
      ];
    }

    if (departmentId) where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        employeeNo: true,
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    });

    return NextResponse.json(employees);
  } catch (error) {
    console.error("GET /api/organizasyon/iletisim error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
