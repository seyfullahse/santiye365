import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Birimler listesi (proje bazlı)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId gerekli" }, { status: 400 });
    }

    const units = await prisma.projectUnit.findMany({
      where: { projectId },
      include: {
        sale: {
          include: {
            customer: true,
            payments: true,
          },
        },
      },
      orderBy: { unitNo: "asc" },
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Birim getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni birim oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const unit = await prisma.projectUnit.create({
      data: {
        projectId: body.projectId,
        unitNo: body.unitNo,
        type: body.type || "DAIRE_2_1",
        floor: body.floor ? parseInt(body.floor) : 0,
        grossArea: body.grossArea ? parseFloat(body.grossArea) : null,
        netArea: body.netArea ? parseFloat(body.netArea) : null,
        roomCount: body.roomCount,
        listPrice: body.listPrice ? parseFloat(body.listPrice) : 0,
        status: body.status || "BOS",
        notes: body.notes,
      },
    });

    return NextResponse.json(unit, { status: 201 });
  } catch (error) {
    console.error("Birim oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
