import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ataşman listesi (sözleşmeye göre)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json(
        { error: "contractId parametresi zorunludur" },
        { status: 400 }
      );
    }

    const atasmanlar = await prisma.atasman.findMany({
      where: { contractId },
      include: {
        kalemler: {
          include: {
            kesifKalemi: {
              select: {
                id: true,
                pozNo: true,
                description: true,
                unit: true,
                quantity: true,
                malzemeFiyati: true,
                iscilikFiyati: true,
                ggkFiyati: true,
                toplamBirimFiyat: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(atasmanlar);
  } catch (error) {
    console.error("Ataşman listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Yeni ataşman oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, atasmanNo, aciklama, katBolge, tarih, kalemler } = body;

    if (!contractId || !atasmanNo) {
      return NextResponse.json(
        { error: "Sözleşme ve ataşman no zorunludur" },
        { status: 400 }
      );
    }

    if (!kalemler || !Array.isArray(kalemler) || kalemler.length === 0) {
      return NextResponse.json(
        { error: "En az bir kalem eklemelisiniz" },
        { status: 400 }
      );
    }

    const atasman = await prisma.atasman.create({
      data: {
        contractId,
        atasmanNo,
        aciklama: aciklama || null,
        katBolge: katBolge || null,
        tarih: tarih ? new Date(tarih) : null,
        kalemler: {
          create: kalemler.map(
            (k: { kesifKalemiId: string; miktar: number; aciklama?: string }) => ({
              kesifKalemiId: k.kesifKalemiId,
              miktar: parseFloat(String(k.miktar)) || 0,
              aciklama: k.aciklama || null,
            })
          ),
        },
      },
      include: {
        kalemler: {
          include: {
            kesifKalemi: {
              select: {
                id: true,
                pozNo: true,
                description: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(atasman, { status: 201 });
  } catch (error) {
    console.error("Ataşman oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — Ataşman sil
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "id parametresi zorunludur" },
        { status: 400 }
      );
    }

    await prisma.atasman.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ataşman silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
