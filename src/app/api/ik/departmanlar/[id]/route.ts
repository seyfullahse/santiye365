import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const department = await prisma.department.update({
      where: { id },
      data: { name: body.name, sortOrder: body.sortOrder ?? undefined },
    });
    return NextResponse.json(department);
  } catch (error) {
    console.error("PUT /api/ik/departmanlar/[id] error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ik/departmanlar/[id] error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
