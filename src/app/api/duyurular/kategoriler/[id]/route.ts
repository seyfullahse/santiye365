import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Kategori güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, color, icon, sortOrder, isActive } = body;

    // Ad kontrolü (başka bir kategoride aynı isim var mı?)
    if (name?.trim()) {
      const existing = await prisma.announcementCategory.findFirst({
        where: { name: name.trim(), id: { not: id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Bu isimde bir kategori zaten mevcut" },
          { status: 409 }
        );
      }
    }

    const category = await prisma.announcementCategory.update({
      where: { id },
      data: {
        ...(name?.trim() && { name: name.trim() }),
        ...(color && { color }),
        ...(icon !== undefined && { icon: icon?.trim() || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(category);
  } catch (error) {
    console.error("Kategori güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Kategori güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE - Kategori sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Bu kategoriye ait duyuru var mı?
    const count = await prisma.announcement.count({
      where: { categoryId: id },
    });
    if (count > 0) {
      return NextResponse.json(
        { error: `Bu kategoriye ait ${count} duyuru bulunmaktadır. Önce duyuruları silin veya başka kategoriye taşıyın.` },
        { status: 400 }
      );
    }

    await prisma.announcementCategory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kategori silme hatası:", error);
    return NextResponse.json(
      { error: "Kategori silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
