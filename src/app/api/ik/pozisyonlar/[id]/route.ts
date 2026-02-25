import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const position = await prisma.position.update({
      where: { id },
      data: { name: body.name, departmentId: body.departmentId, sortOrder: body.sortOrder ?? undefined },
      include: { department: { select: { id: true, name: true } } },
    });
    return NextResponse.json(position);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.position.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
