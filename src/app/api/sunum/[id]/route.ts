import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Sunum detayı (slaytlarla birlikte)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "Geçersiz ID" }, { status: 400 });
    }

    const presentation = await prisma.presentation.findUnique({
      where: { id: numId },
      include: {
        slides: {
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    if (!presentation) {
      return NextResponse.json({ error: "Sunum bulunamadı" }, { status: 404 });
    }

    // Sayac bilgisini ayrı çek (nullable FK güvenliği)
    let countdownTimer = null;
    if (presentation.countdownTimerId) {
      countdownTimer = await prisma.countdownTimer.findUnique({
        where: { id: presentation.countdownTimerId },
        select: { id: true, title: true, targetDate: true, emoji: true, isActive: true },
      });
    }

    return NextResponse.json({ ...presentation, countdownTimer });
  } catch (error) {
    console.error("Sunum detay hatası:", error);
    return NextResponse.json({ error: "Sunum yüklenemedi" }, { status: 500 });
  }
}

// PUT - Sunum güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    const body = await request.json();
    const { name, description, mode, interval, transition, isActive, logoUrl, showClock, tickerText, tickerSpeed, showProgress, countdownTimerId } = body;

    const presentation = await prisma.presentation.update({
      where: { id: numId },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(mode !== undefined && { mode }),
        ...(interval !== undefined && { interval }),
        ...(transition !== undefined && { transition }),
        ...(isActive !== undefined && { isActive }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
        ...(showClock !== undefined && { showClock }),
        ...(tickerText !== undefined && { tickerText: tickerText?.trim() || null }),
        ...(tickerSpeed !== undefined && { tickerSpeed }),
        ...(showProgress !== undefined && { showProgress }),
        ...(countdownTimerId !== undefined && { countdownTimerId: countdownTimerId || null }),
      },
    });

    return NextResponse.json(presentation);
  } catch (error: any) {
    console.error("Sunum güncelleme hatası:", error?.message || error);
    return NextResponse.json({ error: error?.message || "Sunum güncellenemedi" }, { status: 500 });
  }
}

// DELETE - Sunum sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const numId = parseInt(id);
    await prisma.presentation.delete({ where: { id: numId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sunum silme hatası:", error);
    return NextResponse.json({ error: "Sunum silinemedi" }, { status: 500 });
  }
}
