import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Projenin imalat şablonlarını getir
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const sablonlar = await prisma.imalatSablon.findMany({
      where: { projectId },
      orderBy: { varsayilanSira: "asc" },
    });
    return NextResponse.json(sablonlar);
  } catch (error) {
    console.error("Şablonlar alınamadı:", error);
    return NextResponse.json({ error: "Şablonlar alınamadı" }, { status: 500 });
  }
}

// POST — Yeni şablon ekle (tekli veya toplu)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  try {
    const body = await req.json();

    // Toplu ekleme: { items: [...] }
    if (body.items && Array.isArray(body.items)) {
      const data = body.items.map((item: { aciklama: string; yer?: string; disiplinAdi?: string; varsayilanSira?: number }, i: number) => ({
        projectId,
        aciklama: item.aciklama,
        yer: item.yer || "DIGER",
        disiplinAdi: item.disiplinAdi || null,
        varsayilanSira: item.varsayilanSira ?? i + 1,
      }));

      await prisma.imalatSablon.createMany({ data });
      const sablonlar = await prisma.imalatSablon.findMany({
        where: { projectId },
        orderBy: { varsayilanSira: "asc" },
      });
      return NextResponse.json(sablonlar, { status: 201 });
    }

    // Tekli ekleme
    const sablon = await prisma.imalatSablon.create({
      data: {
        projectId,
        aciklama: body.aciklama,
        yer: body.yer || "DIGER",
        disiplinAdi: body.disiplinAdi || null,
        varsayilanSira: body.varsayilanSira ?? 0,
      },
    });
    return NextResponse.json(sablon, { status: 201 });
  } catch (error) {
    console.error("Şablon oluşturulamadı:", error);
    return NextResponse.json({ error: "Şablon oluşturulamadı" }, { status: 500 });
  }
}

// DELETE — Şablon sil
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sablonId = searchParams.get("sablonId");
  if (!sablonId) {
    return NextResponse.json({ error: "sablonId zorunludur" }, { status: 400 });
  }
  try {
    await prisma.imalatSablon.delete({ where: { id: sablonId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Şablon silinemedi:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
