import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Proje + kat bazlı imalat mahallerini getir
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const floorId = searchParams.get("floorId");

  try {
    const where: Record<string, unknown> = { projectId };
    if (floorId) where.floorId = floorId;

    const mahaller = await prisma.imalatMahal.findMany({
      where,
      include: {
        floor: { select: { id: true, name: true } },
        kalemler: {
          include: {
            discipline: { select: { id: true, name: true } },
          },
          orderBy: { siraNo: "asc" },
        },
        _count: { select: { kalemler: true } },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(mahaller);
  } catch (error) {
    console.error("İmalat mahalleri alınamadı:", error);
    return NextResponse.json({ error: "İmalat mahalleri alınamadı" }, { status: 500 });
  }
}

// POST — Yeni imalat mahali oluştur (opsiyonel: şablondan kalemler ekle)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const body = await req.json();
    const { name, floorId, sortOrder, sablonIds } = body;

    if (!name || !floorId) {
      return NextResponse.json({ error: "Mahal adı ve kat zorunludur" }, { status: 400 });
    }

    // Mahalı oluştur
    const mahal = await prisma.imalatMahal.create({
      data: {
        projectId,
        floorId,
        name,
        sortOrder: sortOrder ?? 0,
      },
    });

    // Şablon ID'leri varsa, o şablonlardan kalemler oluştur
    if (sablonIds && Array.isArray(sablonIds) && sablonIds.length > 0) {
      const sablonlar = await prisma.imalatSablon.findMany({
        where: { id: { in: sablonIds }, projectId },
        orderBy: { varsayilanSira: "asc" },
      });

      // Disiplinleri bul
      const disiplinAdlari = [...new Set(sablonlar.filter(s => s.disiplinAdi).map(s => s.disiplinAdi!))];
      const disiplinler = await prisma.discipline.findMany({
        where: { name: { in: disiplinAdlari } },
      });
      const disiplinMap = new Map(disiplinler.map(d => [d.name, d.id]));

      await prisma.imalatKalemi.createMany({
        data: sablonlar.map((s, i) => ({
          imalatMahalId: mahal.id,
          siraNo: i + 1,
          imalatAciklama: s.aciklama,
          yer: s.yer,
          disciplineId: s.disiplinAdi ? disiplinMap.get(s.disiplinAdi) ?? null : null,
          projeDurumu: "GECERLI",
          imalatDurumu: "YAPILMADI",
        })),
      });
    }

    // Oluşturulan mahali kalemlerle dön
    const result = await prisma.imalatMahal.findUnique({
      where: { id: mahal.id },
      include: {
        floor: { select: { id: true, name: true } },
        kalemler: {
          include: { discipline: { select: { id: true, name: true } } },
          orderBy: { siraNo: "asc" },
        },
        _count: { select: { kalemler: true } },
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("İmalat mahali oluşturulamadı:", error);
    return NextResponse.json({ error: "İmalat mahali oluşturulamadı" }, { status: 500 });
  }
}
