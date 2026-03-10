import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm mesajları getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // "active" or "expired"

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;

    const messages = await prisma.sayacMessage.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Sayaç mesajları hatası:", error);
    return NextResponse.json(
      { error: "Mesajlar yüklenemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni mesaj ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, icon, type } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Mesaj metni zorunludur" },
        { status: 400 }
      );
    }

    // Sıradaki en yüksek sortOrder'ı bul
    const maxOrder = await prisma.sayacMessage.findFirst({
      where: { type: type || "active" },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const message = await prisma.sayacMessage.create({
      data: {
        text,
        icon: icon || "Zap",
        type: type || "active",
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Mesaj oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Mesaj oluşturulamadı" },
      { status: 500 }
    );
  }
}
