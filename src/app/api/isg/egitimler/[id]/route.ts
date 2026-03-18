import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.employeeTraining.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const updated = await prisma.employeeTraining.update({
      where: { id },
      data: {
        status: body.status,
        trainingDate: body.trainingDate ? new Date(body.trainingDate) : undefined,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        score: body.score !== undefined ? (body.score ? parseFloat(body.score) : null) : undefined,
        notes: body.notes !== undefined ? (body.notes || null) : undefined,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        training: true,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
