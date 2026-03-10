import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Nakit akış kayıtları
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId gerekli" }, { status: 400 });
    }

    const entries = await prisma.cashFlowEntry.findMany({
      where: { projectId },
      orderBy: { entryDate: "asc" },
    });

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Nakit akış getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni nakit akış kaydı
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const entry = await prisma.cashFlowEntry.create({
      data: {
        projectId: body.projectId,
        type: body.type || "GIRIS",
        category: body.category,
        description: body.description,
        amount: body.amount ? parseFloat(body.amount) : 0,
        entryDate: new Date(body.entryDate),
        isProjection: body.isProjection ?? false,
      },
    });

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Nakit akış oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
