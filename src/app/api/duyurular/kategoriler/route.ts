import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm kategorileri getir
export async function GET() {
  try {
    const categories = await prisma.announcementCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        _count: { select: { announcements: true } },
      },
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Kategori listesi hatası:", error);
    return NextResponse.json(
      { error: "Kategoriler yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Yeni kategori ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, color, icon, sortOrder } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Kategori adı zorunludur" },
        { status: 400 }
      );
    }

    // Aynı isimde kategori var mı kontrol
    const existing = await prisma.announcementCategory.findUnique({
      where: { name: name.trim() },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu isimde bir kategori zaten mevcut" },
        { status: 409 }
      );
    }

    const category = await prisma.announcementCategory.create({
      data: {
        name: name.trim(),
        color: color || "#3B82F6",
        icon: icon?.trim() || null,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error("Kategori ekleme hatası:", error);
    return NextResponse.json(
      { error: "Kategori eklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
