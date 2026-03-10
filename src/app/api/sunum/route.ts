import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm sunumları listele
export async function GET() {
  try {
    const presentations = await prisma.presentation.findMany({
      include: {
        _count: { select: { slides: true } },
        slides: {
          select: { id: true, fileName: true, sortOrder: true },
          orderBy: { sortOrder: "asc" },
          take: 1,
        },
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });

    // Kapak resmi için ilk slaytın küçük halini döndür
    const result = presentations.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      mode: p.mode,
      interval: p.interval,
      transition: p.transition,
      isActive: p.isActive,
      showClock: p.showClock,
      tickerText: p.tickerText,
      slideCount: p._count.slides,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sunum listesi hatası:", error);
    return NextResponse.json({ error: "Sunumlar yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni sunum oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, mode, interval, transition } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Sunum adı zorunludur" }, { status: 400 });
    }

    const presentation = await prisma.presentation.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        mode: mode || "SLIDE",
        interval: interval || 5,
        transition: transition || "fade",
        logoUrl: body.logoUrl || null,
        showClock: body.showClock ?? false,
        tickerText: body.tickerText?.trim() || null,
        tickerSpeed: body.tickerSpeed || 30,
        showProgress: body.showProgress ?? false,
        countdownTimerId: body.countdownTimerId || null,
      },
    });

    return NextResponse.json(presentation, { status: 201 });
  } catch (error: any) {
    console.error("Sunum oluşturma hatası:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Sunum oluşturulamı" }, { status: 500 });
  }
}
