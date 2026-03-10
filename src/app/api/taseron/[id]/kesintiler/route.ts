import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Kesinti listesi
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kesintiler = await prisma.taseronKesinti.findMany({
      where: { companyId: id },
      include: {
        contract: { select: { id: true, name: true } },
        hakedis: { select: { id: true, no: true, period: true } },
      },
      orderBy: { date: "desc" },
    });
    return NextResponse.json(kesintiler);
  } catch (error) {
    console.error("Kesinti listesi hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// POST - Yeni kesinti
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const { type, amount, description, date, contractId, hakedisId } = body;

    if (!amount || !description) {
      return NextResponse.json(
        { error: "Tutar ve açıklama zorunludur" },
        { status: 400 }
      );
    }

    const kesinti = await prisma.taseronKesinti.create({
      data: {
        companyId: id,
        type: type || "DIGER",
        amount: parseFloat(amount) || 0,
        description,
        date: date ? new Date(date) : new Date(),
        contractId: contractId || null,
        hakedisId: hakedisId || null,
      },
    });

    return NextResponse.json(kesinti, { status: 201 });
  } catch (error) {
    console.error("Kesinti kayıt hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// DELETE - Kesinti sil
export async function DELETE(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const kesintiId = searchParams.get("kesintiId");

    if (!kesintiId) {
      return NextResponse.json({ error: "kesintiId gerekli" }, { status: 400 });
    }

    await prisma.taseronKesinti.delete({ where: { id: kesintiId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kesinti silme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
