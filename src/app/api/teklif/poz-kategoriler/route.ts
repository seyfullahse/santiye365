import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Poz kategorilerini listele (disiplin filtreli)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplineId = searchParams.get("disciplineId");

    const categories = await prisma.pozCategory.findMany({
      where: disciplineId ? { disciplineId } : {},
      orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      include: {
        discipline: { select: { id: true, code: true, name: true, color: true } },
        _count: { select: { pozItems: true, children: true } },
        parent: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json({ error: "Kategoriler yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni kategori
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { disciplineId, parentId, code, name } = body;

    if (!disciplineId || !code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "Disiplin, kod ve ad zorunludur" }, { status: 400 });
    }

    const category = await prisma.pozCategory.create({
      data: {
        disciplineId,
        parentId: parentId || null,
        code: code.trim(),
        name: name.trim(),
      },
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Kategori oluşturulamadı" }, { status: 500 });
  }
}
