import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Evrak listesi
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const evraklar = await prisma.taseronEvrak.findMany({
      where: { companyId: id },
      orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(evraklar);
  } catch (error) {
    console.error("Evrak listesi hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// POST - Yeni evrak
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      type,
      title,
      description,
      issueDate,
      expiryDate,
      reminderDays,
    } = body;

    if (!title) {
      return NextResponse.json(
        { error: "Evrak başlığı zorunludur" },
        { status: 400 }
      );
    }

    // Durum hesapla
    let status: "GECERLI" | "SURESI_DOLDU" | "SURESI_YAKLASTI" | "BEKLEMEDE" = "GECERLI";
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const reminderDate = new Date(
        expiry.getTime() - (reminderDays || 30) * 24 * 60 * 60 * 1000
      );
      if (expiry < now) {
        status = "SURESI_DOLDU";
      } else if (now >= reminderDate) {
        status = "SURESI_YAKLASTI";
      }
    }

    const evrak = await prisma.taseronEvrak.create({
      data: {
        companyId: id,
        type: type || "DIGER",
        title,
        description: description || null,
        issueDate: issueDate ? new Date(issueDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        reminderDays: reminderDays || 30,
        status,
      },
    });

    return NextResponse.json(evrak, { status: 201 });
  } catch (error) {
    console.error("Evrak kayıt hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}

// DELETE - Evrak sil
export async function DELETE(
  request: NextRequest,
) {
  try {
    const { searchParams } = new URL(request.url);
    const evrakId = searchParams.get("evrakId");

    if (!evrakId) {
      return NextResponse.json({ error: "evrakId gerekli" }, { status: 400 });
    }

    await prisma.taseronEvrak.delete({ where: { id: evrakId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Evrak silme hatası:", error);
    return NextResponse.json({ error: "Hata oluştu" }, { status: 500 });
  }
}
