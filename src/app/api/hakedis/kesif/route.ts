import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Keşif kalemleri listesi (sözleşmeye göre)
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

    const items = await prisma.hakedisContractItem.findMany({
      where: { contractId },
      orderBy: [{ anaGrup: "asc" }, { altGrup: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Keşif kalemleri hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Keşif kalemlerini toplu kaydet (sözleşme altına)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contractId, items } = body;

    if (!contractId || !items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: "contractId ve items dizisi zorunludur" },
        { status: 400 }
      );
    }

    // Mevcut kalemleri sil ve yeniden oluştur (upsert yerine toplu replace)
    await prisma.$transaction(async (tx) => {
      // Ataşman kalemlerinde referans var mı kontrol et
      const existingAtasmanRefs = await tx.atasmanKalemi.findFirst({
        where: {
          kesifKalemi: { contractId },
        },
      });

      if (existingAtasmanRefs) {
        // Ataşman referansı olan kalemleri silmemek için sadece güncelleyelim
        // Önce mevcut kalemleri al
        const existingItems = await tx.hakedisContractItem.findMany({
          where: { contractId },
          select: { id: true, pozNo: true },
        });
        const existingByPoz = new Map(existingItems.map((i) => [i.pozNo, i.id]));

        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx];
          const existingId = existingByPoz.get(item.pozNo);

          const data = {
            anaGrup: item.anaGrup || null,
            altGrup: item.altGrup || null,
            isKalemiGrubu: item.isKalemiGrubu || null,
            pozNo: item.pozNo,
            description: item.description || item.aciklama || "",
            unit: item.unit || item.birim || "",
            quantity: parseFloat(item.quantity || item.sozlesmeMiktar || 0),
            marka: item.marka || null,
            sartname: item.sartname || null,
            malzemeFiyati: parseFloat(item.malzemeFiyati || 0),
            iscilikFiyati: parseFloat(item.iscilikFiyati || 0),
            ggkFiyati: parseFloat(item.ggkFiyati || 0),
            toplamBirimFiyat: parseFloat(item.toplamBirimFiyat || 0),
            toplamTutar: parseFloat(item.toplamTutar || 0),
            sortOrder: idx,
          };

          if (existingId) {
            await tx.hakedisContractItem.update({
              where: { id: existingId },
              data,
            });
          } else {
            await tx.hakedisContractItem.create({
              data: { ...data, contractId },
            });
          }
        }
      } else {
        // Ataşman referansı yok — güvenle sil-oluştur
        await tx.hakedisContractItem.deleteMany({ where: { contractId } });

        await tx.hakedisContractItem.createMany({
          data: items.map(
            (
              item: Record<string, string | number | undefined>,
              idx: number
            ) => ({
              contractId,
              anaGrup: (item.anaGrup as string) || null,
              altGrup: (item.altGrup as string) || null,
              isKalemiGrubu: (item.isKalemiGrubu as string) || null,
              pozNo: (item.pozNo as string) || "",
              description:
                (item.description as string) ||
                (item.aciklama as string) ||
                "",
              unit: (item.unit as string) || (item.birim as string) || "",
              quantity: parseFloat(
                String(item.quantity || item.sozlesmeMiktar || 0)
              ),
              marka: (item.marka as string) || null,
              sartname: (item.sartname as string) || null,
              malzemeFiyati: parseFloat(String(item.malzemeFiyati || 0)),
              iscilikFiyati: parseFloat(String(item.iscilikFiyati || 0)),
              ggkFiyati: parseFloat(String(item.ggkFiyati || 0)),
              toplamBirimFiyat: parseFloat(
                String(item.toplamBirimFiyat || 0)
              ),
              toplamTutar: parseFloat(String(item.toplamTutar || 0)),
              sortOrder: idx,
            })
          ),
        });
      }

      // Sözleşme toplam tutarını güncelle
      const totalAmount = items.reduce(
        (sum: number, item: Record<string, string | number | undefined>) =>
          sum + parseFloat(String(item.toplamTutar || 0)),
        0
      );
      await tx.hakedisContract.update({
        where: { id: contractId },
        data: { totalAmount },
      });
    });

    // Güncellenmiş listeyi döndür
    const updated = await prisma.hakedisContractItem.findMany({
      where: { contractId },
      orderBy: [{ anaGrup: "asc" }, { altGrup: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Keşif kaydetme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
