import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm yatırım projelerini listele
export async function GET() {
  try {
    const projects = await prisma.investmentProject.findMany({
      include: {
        units: {
          include: {
            sale: {
              include: {
                payments: true,
              },
            },
          },
        },
        _count: {
          select: {
            units: true,
            feasibilityItems: true,
            cashFlowEntries: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Her proje için özet hesapla
    const projectsWithSummary = projects.map((p) => {
      const soldUnits = p.units.filter((u) => u.status === "SATILDI" || u.status === "TESLIM_EDILDI");
      const totalSaleAmount = soldUnits.reduce((sum, u) => {
        return sum + (u.sale?.salePrice ?? 0);
      }, 0);
      const totalCollected = soldUnits.reduce((sum, u) => {
        if (!u.sale) return sum;
        return sum + u.sale.payments.reduce((ps, pay) => ps + pay.paidAmount, 0);
      }, 0);

      return {
        ...p,
        units: undefined,
        soldUnits: soldUnits.length,
        totalSaleAmount,
        totalCollected,
      };
    });

    return NextResponse.json(projectsWithSummary);
  } catch (error) {
    console.error("Yatırım projeleri getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni yatırım projesi oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const project = await prisma.investmentProject.create({
      data: {
        name: body.name,
        type: body.type || "KONUT",
        status: body.status || "FIZIBILITE",
        city: body.city,
        district: body.district,
        address: body.address,
        landArea: body.landArea ? parseFloat(body.landArea) : null,
        constructionArea: body.constructionArea ? parseFloat(body.constructionArea) : null,
        totalUnits: body.totalUnits ? parseInt(body.totalUnits) : 0,
        totalBudget: body.totalBudget ? parseFloat(body.totalBudget) : 0,
        totalRevenue: body.totalRevenue ? parseFloat(body.totalRevenue) : 0,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        completionPct: body.completionPct ? parseFloat(body.completionPct) : 0,
        description: body.description,
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Yatırım projesi oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
