import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Slaytlar ekle (base64 data URI olarak)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    const body = await request.json();
    const { slides } = body; // [{ imageUrl, fileName }]

    if (!slides || !Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "En az bir resim gerekli" }, { status: 400 });
    }

    // Mevcut en yüksek sortOrder'ı bul
    const maxOrder = await prisma.presentationSlide.findFirst({
      where: { presentationId: numId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    let nextOrder = (maxOrder?.sortOrder ?? -1) + 1;

    const created = [];
    for (const slide of slides) {
      if (!slide.imageUrl) continue;
      const s = await prisma.presentationSlide.create({
        data: {
          presentationId: numId,
          imageUrl: slide.imageUrl,
          fileName: slide.fileName || null,
          sortOrder: nextOrder++,
        },
      });
      created.push({ id: s.id, fileName: s.fileName, sortOrder: s.sortOrder });
    }

    return NextResponse.json({ added: created.length, slides: created }, { status: 201 });
  } catch (error) {
    console.error("Slayt ekleme hatası:", error);
    return NextResponse.json({ error: "Slaytlar eklenemedi" }, { status: 500 });
  }
}

// DELETE - Slayt sil (query param: slideId)
export async function DELETE(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const slideId = searchParams.get("slideId");

    if (!slideId) {
      return NextResponse.json({ error: "slideId gerekli" }, { status: 400 });
    }

    await prisma.presentationSlide.delete({ where: { id: parseInt(slideId) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Slayt silme hatası:", error);
    return NextResponse.json({ error: "Slayt silinemedi" }, { status: 500 });
  }
}
