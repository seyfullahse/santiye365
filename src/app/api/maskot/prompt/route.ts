import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm prompt context'leri getir
export async function GET() {
  try {
    const contexts = await prisma.mascotPromptContext.findMany({
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(contexts);
  } catch (error) {
    console.error("Prompt context hatası:", error);
    return NextResponse.json({ error: "Prompt bilgileri yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni prompt context ekle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, label, content } = body;

    if (!key || !label || !content) {
      return NextResponse.json({ error: "Key, label ve content zorunludur" }, { status: 400 });
    }

    const existing = await prisma.mascotPromptContext.findUnique({ where: { key } });
    if (existing) {
      // Varsa güncelle
      const updated = await prisma.mascotPromptContext.update({
        where: { key },
        data: { label, content },
      });
      return NextResponse.json(updated);
    }

    const maxOrder = await prisma.mascotPromptContext.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const ctx = await prisma.mascotPromptContext.create({
      data: {
        key,
        label,
        content,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(ctx, { status: 201 });
  } catch (error) {
    console.error("Prompt context oluşturma hatası:", error);
    return NextResponse.json({ error: "Oluşturulamadı" }, { status: 500 });
  }
}
