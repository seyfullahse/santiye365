import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tekil maskot
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const mascot = await prisma.mascot.findUnique({
      where: { id },
      include: {
        conversations: {
          orderBy: { createdAt: "desc" },
          take: 50,
        },
        _count: { select: { conversations: true } },
      },
    });
    if (!mascot) {
      return NextResponse.json({ error: "Maskot bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(mascot);
  } catch (error) {
    console.error("Maskot detay hatası:", error);
    return NextResponse.json({ error: "Maskot yüklenemedi" }, { status: 500 });
  }
}

// PUT - Maskot güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      name, role, gender, personality, avatarType, avatarData,
      emoji, primaryColor, voicePitch, voiceRate, isActive, isDefault,
    } = body;

    if (isDefault) {
      await prisma.mascot.updateMany({
        where: { isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const mascot = await prisma.mascot.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(gender !== undefined && { gender }),
        ...(personality !== undefined && { personality }),
        ...(avatarType !== undefined && { avatarType }),
        ...(avatarData !== undefined && { avatarData }),
        ...(emoji !== undefined && { emoji }),
        ...(primaryColor !== undefined && { primaryColor }),
        ...(voicePitch !== undefined && { voicePitch }),
        ...(voiceRate !== undefined && { voiceRate }),
        ...(isActive !== undefined && { isActive }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return NextResponse.json(mascot);
  } catch (error) {
    console.error("Maskot güncelleme hatası:", error);
    return NextResponse.json({ error: "Maskot güncellenemedi" }, { status: 500 });
  }
}

// DELETE - Maskot sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.mascot.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Maskot silme hatası:", error);
    return NextResponse.json({ error: "Maskot silinemedi" }, { status: 500 });
  }
}
