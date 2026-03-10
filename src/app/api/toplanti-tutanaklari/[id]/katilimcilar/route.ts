import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Katılımcıları güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: meetingId } = await params;
    const body = await request.json();
    const { participants } = body;

    if (!Array.isArray(participants)) {
      return NextResponse.json(
        { error: "participants dizisi zorunludur" },
        { status: 400 }
      );
    }

    // Mevcut katılımcıları sil ve yeniden oluştur
    await prisma.meetingParticipant.deleteMany({ where: { meetingId } });

    const created = await prisma.meetingParticipant.createMany({
      data: participants.map((p: { name: string; company?: string; role?: string; email?: string; phone?: string; isPresent?: boolean }) => ({
        meetingId,
        name: p.name,
        company: p.company,
        role: p.role,
        email: p.email,
        phone: p.phone,
        isPresent: p.isPresent ?? true,
      })),
    });

    const result = await prisma.meetingParticipant.findMany({
      where: { meetingId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Katılımcı güncelleme hatası:", error);
    return NextResponse.json({ error: "Katılımcılar güncellenemedi" }, { status: 500 });
  }
}
