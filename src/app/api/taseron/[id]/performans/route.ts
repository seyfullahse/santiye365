import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - Performans listesi
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const performanslar = await prisma.taseronPerformans.findMany({
      where: { companyId: id },
      include: {
        evaluatedBy: { select: { id: true, name: true } },
        contract: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(performanslar);
  } catch (error) {
    console.error("Performans listesi hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// POST - Yeni performans değerlendirmesi
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const body = await request.json();

    const {
      period,
      kalitePuani,
      surePuani,
      isgPuani,
      iletisimPuani,
      malzemePuani,
      genelPuan,
      contractId,
      notes,
    } = body;

    if (!period) {
      return NextResponse.json({ error: "Dönem zorunludur" }, { status: 400 });
    }

    const performans = await prisma.taseronPerformans.create({
      data: {
        companyId: id,
        period,
        kalitePuani: kalitePuani || 0,
        surePuani: surePuani || 0,
        isgPuani: isgPuani || 0,
        iletisimPuani: iletisimPuani || 0,
        malzemePuani: malzemePuani || 0,
        genelPuan: genelPuan || 0,
        contractId: contractId || null,
        notes: notes || null,
        evaluatedById: session?.user?.id || null,
      },
    });

    // Company rating güncelle (son ortalama)
    const allPerformans = await prisma.taseronPerformans.findMany({
      where: { companyId: id },
      select: { genelPuan: true },
    });
    const avgRating =
      allPerformans.reduce((sum: number, p: any) => sum + p.genelPuan, 0) / allPerformans.length;
    await prisma.company.update({
      where: { id },
      data: { rating: Math.round(avgRating * 10) / 10 } as any,
    });

    return NextResponse.json(performans, { status: 201 });
  } catch (error) {
    console.error("Performans kayıt hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// DELETE - Performans sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const performansId = searchParams.get("performansId");

    if (!performansId) {
      return NextResponse.json({ error: "performansId gerekli" }, { status: 400 });
    }

    await prisma.taseronPerformans.delete({ where: { id: performansId } });

    // Rating güncelle
    const allPerformans = await prisma.taseronPerformans.findMany({
      where: { companyId: id },
      select: { genelPuan: true },
    });
    const avgRating = allPerformans.length > 0
      ? allPerformans.reduce((sum: number, p: any) => sum + p.genelPuan, 0) / allPerformans.length
      : null;
    await prisma.company.update({
      where: { id },
      data: { rating: avgRating ? Math.round(avgRating * 10) / 10 : null } as any,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Performans silme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
