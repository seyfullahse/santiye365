/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET — Hesap bağlanabilir çalışanları listele (henüz kullanıcısı olmayan)
export async function GET() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  // Zaten bir user hesabına bağlı olan employee ID'leri
  const linkedEmployeeIds = (
    await (prisma.user as any).findMany({
      where: { employeeId: { not: null } },
      select: { employeeId: true },
    })
  ).map((u: any) => u.employeeId);

  const employees = await prisma.employee.findMany({
    where: {
      status: "ACTIVE",
      id: { notIn: linkedEmployeeIds },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      employeeNo: true,
      email: true,
      phone: true,
      department: { select: { id: true, name: true } },
      position: { select: { id: true, name: true } },
      company: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
  });

  return NextResponse.json(employees);
}
