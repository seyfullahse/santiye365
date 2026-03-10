import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm disiplinleri listele
export async function GET() {
  try {
    const disciplines = await prisma.teklifDiscipline.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { categories: true } },
      },
    });
    return NextResponse.json(disciplines);
  } catch (error: any) {
    console.error("Disiplin listesi hatası:", error?.message);
    return NextResponse.json({ error: "Disiplinler yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni disiplin oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code, name, color, icon } = body;

    if (!code?.trim() || !name?.trim()) {
      return NextResponse.json({ error: "Kod ve ad zorunludur" }, { status: 400 });
    }

    const existing = await prisma.teklifDiscipline.findUnique({ where: { code: code.trim() } });
    if (existing) {
      return NextResponse.json({ error: "Bu kod zaten kullanılıyor" }, { status: 400 });
    }

    const maxSort = await prisma.teklifDiscipline.aggregate({ _max: { sortOrder: true } });
    
    const discipline = await prisma.teklifDiscipline.create({
      data: {
        code: code.trim(),
        name: name.trim(),
        color: color || "#3b82f6",
        icon: icon || "Hammer",
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
      },
    });

    return NextResponse.json(discipline, { status: 201 });
  } catch (error: any) {
    console.error("Disiplin oluşturma hatası:", error?.message);
    return NextResponse.json({ error: error?.message || "Disiplin oluşturulamadı" }, { status: 500 });
  }
}
