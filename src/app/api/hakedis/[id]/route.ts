import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Tek hakediş detay (eski endpoint — özet sayfası uyumluluğu için korundu)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const hakedis = await prisma.hakedis.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    if (!hakedis) {
      return NextResponse.json({ error: "Hakediş bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(hakedis);
  } catch (error) {
    console.error("Hakediş detay hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT — Hakediş durum/bilgi güncelle (status, period, notes)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { period, startDate, endDate, notes, status } = body;

    const existing = await prisma.hakedis.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Hakediş bulunamadı" }, { status: 404 });
    }

    const updated = await prisma.hakedis.update({
      where: { id },
      data: {
        ...(period && { period }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Hakediş güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — Hakediş sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.hakedis.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Hakediş silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
