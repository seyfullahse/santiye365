import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE — Ataşman sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.atasman.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Ataşman silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// GET — Tek ataşman detayı
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const atasman = await prisma.atasman.findUnique({
      where: { id },
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
    });

    if (!atasman) {
      return NextResponse.json({ error: "Ataşman bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(atasman);
  } catch (error) {
    console.error("Ataşman detay hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
