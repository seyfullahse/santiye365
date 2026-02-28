import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Aktif sayaçları getir
export async function GET() {
  try {
    const timers = await prisma.countdownTimer.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
    });
    return NextResponse.json(timers);
  } catch (error) {
    console.error("Sayaç listesi hatası:", error);
    return NextResponse.json(
      { error: "Sayaçlar yüklenemedi" },
      { status: 500 }
    );
  }
}

// POST - Yeni sayaç oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, targetDate, emoji } = body;

    if (!targetDate) {
      return NextResponse.json(
        { error: "Hedef tarih zorunludur" },
        { status: 400 }
      );
    }

    const timer = await prisma.countdownTimer.create({
      data: {
        title: title || "Haftalık Hedef",
        description: description || null,
        targetDate: new Date(targetDate),
        emoji: emoji || "🏗️",
      },
    });

    return NextResponse.json(timer, { status: 201 });
  } catch (error) {
    console.error("Sayaç oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Sayaç oluşturulamadı" },
      { status: 500 }
    );
  }
}
