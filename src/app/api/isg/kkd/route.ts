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

    const assignments = await prisma.pPEAssignment.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
        ppeType: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const assignment = await prisma.pPEAssignment.create({
      data: {
        employeeId: body.employeeId,
        ppeTypeId: body.ppeTypeId,
        assignDate: new Date(body.assignDate),
        returnDate: body.returnDate ? new Date(body.returnDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        serialNo: body.serialNo || null,
        status: body.status || "ASSIGNED",
        notes: body.notes || null,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        ppeType: true,
      },
    });
    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
