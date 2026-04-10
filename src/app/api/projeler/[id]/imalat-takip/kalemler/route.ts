import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST — Mahal'e yeni imalat kalemi ekle
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const body = await req.json();
    const { imalatMahalId, imalatAciklama, yer, disciplineId, siraNo, projeDurumu, sorumlu, ilgiliTaseron } = body;

    if (!imalatMahalId || !imalatAciklama) {
      return NextResponse.json({ error: "Mahal ID ve açıklama zorunludur" }, { status: 400 });
    }

    // Mahalin bu projeye ait olduğunu doğrula
    const mahal = await prisma.imalatMahal.findFirst({
      where: { id: imalatMahalId, projectId },
    });
    if (!mahal) {
      return NextResponse.json({ error: "Mahal bulunamadı" }, { status: 404 });
    }

    // Sıra no belirleme
    let finalSiraNo = siraNo;
    if (finalSiraNo === undefined || finalSiraNo === null) {
      const maxSira = await prisma.imalatKalemi.aggregate({
        where: { imalatMahalId },
        _max: { siraNo: true },
      });
      finalSiraNo = (maxSira._max.siraNo ?? 0) + 1;
    }

    const kalem = await prisma.imalatKalemi.create({
      data: {
        imalatMahalId,
        siraNo: finalSiraNo,
        imalatAciklama,
        yer: yer || "DIGER",
        disciplineId: disciplineId || null,
        projeDurumu: projeDurumu || "GECERLI",
        imalatDurumu: "YAPILMADI",
        sorumlu: sorumlu || null,
        ilgiliTaseron: ilgiliTaseron || null,
      },
      include: {
        discipline: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(kalem, { status: 201 });
  } catch (error) {
    console.error("İmalat kalemi oluşturulamadı:", error);
    return NextResponse.json({ error: "İmalat kalemi oluşturulamadı" }, { status: 500 });
  }
}

// PUT — İmalat kalemi güncelle (tek veya toplu)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params; // projectId validation could be added
  try {
    const body = await req.json();

    // Toplu sıra güncelleme: { reorder: [{ id, siraNo }] }
    if (body.reorder && Array.isArray(body.reorder)) {
      await prisma.$transaction(
        body.reorder.map((item: { id: string; siraNo: number }) =>
          prisma.imalatKalemi.update({
            where: { id: item.id },
            data: { siraNo: item.siraNo },
          })
        )
      );
      return NextResponse.json({ success: true });
    }

    // Tek kalem güncelleme
    if (!body.id) {
      return NextResponse.json({ error: "Kalem ID zorunludur" }, { status: 400 });
    }

    const kalem = await prisma.imalatKalemi.update({
      where: { id: body.id },
      data: {
        ...(body.siraNo !== undefined && { siraNo: body.siraNo }),
        ...(body.imalatAciklama !== undefined && { imalatAciklama: body.imalatAciklama }),
        ...(body.yer !== undefined && { yer: body.yer }),
        ...(body.disciplineId !== undefined && { disciplineId: body.disciplineId || null }),
        ...(body.projeDurumu !== undefined && { projeDurumu: body.projeDurumu }),
        ...(body.imalatDurumu !== undefined && { imalatDurumu: body.imalatDurumu }),
        ...(body.aksiyon !== undefined && { aksiyon: body.aksiyon }),
        ...(body.sorumlu !== undefined && { sorumlu: body.sorumlu }),
        ...(body.ilgiliTaseron !== undefined && { ilgiliTaseron: body.ilgiliTaseron }),
        ...(body.notlar !== undefined && { notlar: body.notlar }),
      },
      include: {
        discipline: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(kalem);
  } catch (error) {
    console.error("İmalat kalemi güncellenemedi:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}

// DELETE — İmalat kalemi sil
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const kalemId = searchParams.get("kalemId");
  if (!kalemId) {
    return NextResponse.json({ error: "kalemId zorunludur" }, { status: 400 });
  }
  try {
    await prisma.imalatKalemi.delete({ where: { id: kalemId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İmalat kalemi silinemedi:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
