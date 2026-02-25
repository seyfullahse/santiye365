import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.status) data.status = body.status;
    if (body.approvedBy) data.approvedBy = body.approvedBy;
    if (body.status === "APPROVED") data.approvedAt = new Date();
    if (body.rejectionNote) data.rejectionNote = body.rejectionNote;

    const request = await prisma.leaveRequest.update({
      where: { id },
      data,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });

    // Onaylandıysa bakiyeyi güncelle
    if (body.status === "APPROVED") {
      const year = new Date(request.startDate).getFullYear();
      await prisma.leaveBalance.upsert({
        where: { employeeId_year: { employeeId: request.employeeId, year } },
        create: { employeeId: request.employeeId, year, totalDays: 14, usedDays: request.totalDays, remainingDays: 14 - request.totalDays },
        update: { usedDays: { increment: request.totalDays }, remainingDays: { decrement: request.totalDays } },
      });
    }

    return NextResponse.json(request);
  } catch (error) {
    console.error("PUT /api/ik/izinler/[id] error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.leaveRequest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
