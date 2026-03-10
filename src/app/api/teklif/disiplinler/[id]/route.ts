import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Disiplin detayı
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const discipline = await prisma.teklifDiscipline.findUnique({
      where: { id },
      include: {
        categories: {
          orderBy: { sortOrder: "asc" },
          include: { _count: { select: { pozItems: true, children: true } } },
        },
      },
    });
    if (!discipline) return NextResponse.json({ error: "Disiplin bulunamadı" }, { status: 404 });
    return NextResponse.json(discipline);
  } catch (error: any) {
    return NextResponse.json({ error: "Disiplin yüklenemedi" }, { status: 500 });
  }
}

// PUT - Disiplin güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, name, color, icon, isActive } = body;

    const discipline = await prisma.teklifDiscipline.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.trim() }),
        ...(name !== undefined && { name: name.trim() }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(discipline);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Güncellenemedi" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.teklifDiscipline.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Disiplin silinemedi" }, { status: 500 });
  }
}
