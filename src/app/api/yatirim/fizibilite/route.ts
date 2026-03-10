import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Fizibilite kalemlerini getir (projeye göre)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId gerekli" }, { status: 400 });
    }

    const items = await prisma.feasibilityItem.findMany({
      where: { projectId },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }],
    });

    return NextResponse.json(items);
  } catch (error) {
    console.error("Fizibilite getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni fizibilite kalemi
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const item = await prisma.feasibilityItem.create({
      data: {
        projectId: body.projectId,
        type: body.type || "MALIYET",
        category: body.category,
        description: body.description,
        amount: body.amount ? parseFloat(body.amount) : 0,
        sortOrder: body.sortOrder ? parseInt(body.sortOrder) : 0,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Fizibilite oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
