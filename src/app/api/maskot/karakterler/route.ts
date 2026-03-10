import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm maskotları getir
export async function GET() {
  try {
    const mascots = await prisma.mascot.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        _count: { select: { conversations: true } },
      },
    });
    return NextResponse.json(mascots);
  } catch (error) {
    console.error("Maskot listesi hatası:", error);
    return NextResponse.json({ error: "Maskotlar yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni maskot oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name, role, gender, personality, avatarType, avatarData,
      emoji, primaryColor, voicePitch, voiceRate, isDefault,
    } = body;

    if (!name || !personality) {
      return NextResponse.json({ error: "İsim ve kişilik zorunludur" }, { status: 400 });
    }

    // Eğer default yapılıyorsa diğerlerini kaldır
    if (isDefault) {
      await prisma.mascot.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const maxOrder = await prisma.mascot.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const mascot = await prisma.mascot.create({
      data: {
        name,
        role: role || "MIMAR",
        gender: gender || "KADIN",
        personality,
        avatarType: avatarType || "svg",
        avatarData: avatarData || null,
        emoji: emoji || "👩‍🎨",
        primaryColor: primaryColor || "#8B5CF6",
        voicePitch: voicePitch ?? 1.0,
        voiceRate: voiceRate ?? 1.0,
        isDefault: isDefault || false,
        sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
      },
    });

    return NextResponse.json(mascot, { status: 201 });
  } catch (error) {
    console.error("Maskot oluşturma hatası:", error);
    return NextResponse.json({ error: "Maskot oluşturulamadı" }, { status: 500 });
  }
}
