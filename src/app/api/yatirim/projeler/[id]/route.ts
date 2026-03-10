import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tek yatırım projesi detayı
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await prisma.investmentProject.findUnique({
      where: { id },
      include: {
        units: {
          include: {
            sale: {
              include: {
                payments: true,
                customer: true,
              },
            },
          },
          orderBy: { unitNo: "asc" },
        },
        feasibilityItems: {
          orderBy: { sortOrder: "asc" },
        },
        cashFlowEntries: {
          orderBy: { entryDate: "asc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("Yatırım projesi detay hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// PUT - Yatırım projesi güncelle
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const project = await prisma.investmentProject.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        status: body.status,
        city: body.city,
        district: body.district,
        address: body.address,
        landArea: body.landArea !== undefined ? parseFloat(body.landArea) : undefined,
        constructionArea: body.constructionArea !== undefined ? parseFloat(body.constructionArea) : undefined,
        totalUnits: body.totalUnits !== undefined ? parseInt(body.totalUnits) : undefined,
        totalBudget: body.totalBudget !== undefined ? parseFloat(body.totalBudget) : undefined,
        totalRevenue: body.totalRevenue !== undefined ? parseFloat(body.totalRevenue) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        completionPct: body.completionPct !== undefined ? parseFloat(body.completionPct) : undefined,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json(project);
  } catch (error) {
    console.error("Yatırım projesi güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE - Yatırım projesi sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.investmentProject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yatırım projesi silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
