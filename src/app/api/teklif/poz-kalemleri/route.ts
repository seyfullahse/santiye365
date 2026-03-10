import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Poz kalemlerini listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const disciplineId = searchParams.get("disciplineId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("pageSize") || searchParams.get("limit") || "100");

    const where: any = { isActive: true };
    if (categoryId) where.categoryId = categoryId;
    if (disciplineId) where.category = { disciplineId };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [items, total] = await Promise.all([
      prisma.pozItem.findMany({
        where,
        orderBy: [{ code: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: { id: true, code: true, name: true, discipline: { select: { id: true, code: true, name: true, color: true } } },
          },
        },
      }),
      prisma.pozItem.count({ where }),
    ]);

    return NextResponse.json({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error: any) {
    return NextResponse.json({ error: "Poz kalemleri yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni poz kalemi
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { categoryId, code, description, unit, laborCost, materialCost, equipmentCost, source, year, notes } = body;

    if (!categoryId || !code?.trim() || !description?.trim() || !unit?.trim()) {
      return NextResponse.json({ error: "Kategori, kod, açıklama ve birim zorunludur" }, { status: 400 });
    }

    const labor = parseFloat(laborCost) || 0;
    const material = parseFloat(materialCost) || 0;
    const equipment = parseFloat(equipmentCost) || 0;

    const pozItem = await prisma.pozItem.create({
      data: {
        categoryId,
        code: code.trim(),
        description: description.trim(),
        unit: unit.trim(),
        laborCost: labor,
        materialCost: material,
        equipmentCost: equipment,
        unitPrice: labor + material + equipment,
        source: source || "custom",
        year: year || 2026,
        notes: notes || null,
      },
    });
    return NextResponse.json(pozItem, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Poz kalemi oluşturulamadı" }, { status: 500 });
  }
}
