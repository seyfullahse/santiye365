import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Tek sözleşme detayı
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contract = await prisma.hakedisContract.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    if (!contract) {
      return NextResponse.json({ error: "Sözleşme bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Sözleşme detay hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT — Sözleşme güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      name,
      type,
      projectId,
      companyId,
      contractNo,
      contractDate,
      advanceRate,
      retentionRate,
      description,
      currency,
      pricingModel,
    } = body;

    if (!name || !projectId || !type) {
      return NextResponse.json(
        { error: "Sözleşme adı, proje ve tip zorunludur" },
        { status: 400 }
      );
    }

    const contract = await prisma.hakedisContract.update({
      where: { id },
      data: {
        name,
        type,
        projectId,
        companyId: companyId || null,
        contractNo: contractNo || null,
        contractDate: contractDate ? new Date(contractDate) : null,
        advanceRate: advanceRate ?? 0,
        retentionRate: retentionRate ?? 0,
        description: description || null,
        ...(currency !== undefined && { currency }),
        ...(pricingModel !== undefined && { pricingModel }),
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(contract);
  } catch (error) {
    console.error("Sözleşme güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE — Sözleşme sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.hakedisContract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Sözleşme silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
