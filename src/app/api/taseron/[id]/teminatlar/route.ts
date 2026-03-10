import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Teminat listesi
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const teminatlar = await prisma.taseronTeminat.findMany({
      where: { companyId: id },
      include: {
        contract: { select: { id: true, name: true } },
      },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(teminatlar);
  } catch (error) {
    console.error("Teminat listesi hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// POST - Yeni teminat
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      type,
      amount,
      currency,
      bankName,
      letterNo,
      startDate,
      endDate,
      contractId,
      notes,
    } = body;

    if (!amount) {
      return NextResponse.json({ error: "Tutar zorunludur" }, { status: 400 });
    }

    const teminat = await prisma.taseronTeminat.create({
      data: {
        companyId: id,
        type: type || "KESIN_TEMINAT",
        amount: parseFloat(amount) || 0,
        currency: currency || "TRY",
        bankName: bankName || null,
        letterNo: letterNo || null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        contractId: contractId || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(teminat, { status: 201 });
  } catch (error) {
    console.error("Teminat kayıt hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// DELETE - Teminat sil
export async function DELETE(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const teminatId = searchParams.get("teminatId");

    if (!teminatId) {
      return NextResponse.json({ error: "teminatId gerekli" }, { status: 400 });
    }

    await prisma.taseronTeminat.delete({ where: { id: teminatId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Teminat silme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
