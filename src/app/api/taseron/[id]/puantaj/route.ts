import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - Puantaj listesi
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const puantajlar = await (prisma.taseronPuantaj as any).findMany({
      where: { companyId: id },
      include: {
        kalemler: true,
        contract: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(puantajlar);
  } catch (error) {
    console.error("Puantaj listesi hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// POST - Yeni puantaj kaydı
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { date, contractId, kalemler, notes } = body;

    if (!date) {
      return NextResponse.json({ error: "Tarih zorunludur" }, { status: 400 });
    }

    if (!kalemler || kalemler.length === 0) {
      return NextResponse.json(
        { error: "En az bir pozisyon kalemi ekleyin" },
        { status: 400 }
      );
    }

    // Toplamları hesapla
    const toplamIsci = kalemler.reduce((s: number, k: any) => s + (k.sayi || 0), 0);
    const toplamMesai = kalemler.reduce((s: number, k: any) => s + (k.mesaiSaat || 0), 0);
    const toplamDevamsiz = kalemler.reduce((s: number, k: any) => s + (k.devamsiz || 0), 0);

    const puantaj = await (prisma.taseronPuantaj as any).create({
      data: {
        companyId: id,
        contractId: contractId || null,
        date: new Date(date),
        toplamIsci,
        toplamMesai,
        toplamDevamsiz,
        notes: notes || null,
        kalemler: {
          create: kalemler.map((k: any) => ({
            pozisyon: k.pozisyon,
            sayi: k.sayi || 0,
            mesaiSaat: k.mesaiSaat || 0,
            devamsiz: k.devamsiz || 0,
            notes: k.notes || null,
          })),
        },
      },
      include: {
        kalemler: true,
        contract: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(puantaj, { status: 201 });
  } catch (error: any) {
    console.error("Puantaj kayıt hatası:", error);
    // Unique constraint violation (aynı tarih+firma)
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Bu tarih için zaten puantaj kaydı mevcut" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// DELETE - Puantaj sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const puantajId = searchParams.get("puantajId");

    if (!puantajId) {
      return NextResponse.json({ error: "puantajId gerekli" }, { status: 400 });
    }

    await (prisma.taseronPuantaj as any).delete({ where: { id: puantajId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Puantaj silme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
