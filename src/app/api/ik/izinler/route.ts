import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const requests = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, department: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(requests);
  } catch (error) {
    console.error("GET /api/ik/izinler error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        startDate: new Date(body.startDate),
        endDate: new Date(body.endDate),
        totalDays: parseFloat(body.totalDays),
        reason: body.reason || null,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return NextResponse.json(request, { status: 201 });
  } catch (error) {
    console.error("POST /api/ik/izinler error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
