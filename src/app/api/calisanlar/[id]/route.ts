import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const worker = await prisma.worker.update({
      where: { id },
      data: {
        teamId: body.teamId,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        sortOrder: body.sortOrder ?? 0,
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, sortOrder: true } },
            discipline: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json(worker);
  } catch (error) {
    console.error("Çalışan güncellenemedi:", error);
    return NextResponse.json(
      { error: "Çalışan güncellenemedi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.worker.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Çalışan silinemedi:", error);
    return NextResponse.json(
      { error: "Çalışan silinemedi" },
      { status: 500 }
    );
  }
}
