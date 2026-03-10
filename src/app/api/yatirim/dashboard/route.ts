import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Yatırım Dashboard özet verileri
export async function GET() {
  try {
    // Tüm yatırım projeleri
    const projects = await prisma.investmentProject.findMany({
      include: {
        units: {
          include: {
            sale: {
              include: { payments: true },
            },
          },
        },
        feasibilityItems: true,
      },
    });

    // Genel istatistikler
    let totalProjects = projects.length;
    let activeProjects = 0;
    let totalBudget = 0;
    let totalRevenue = 0;
    let totalUnits = 0;
    let soldUnits = 0;
    let totalSaleAmount = 0;
    let totalCollected = 0;
    let totalPending = 0;

    const projectSummaries = projects.map((p) => {
      if (p.status !== "IPTAL" && p.status !== "TAMAMLANDI") activeProjects++;
      totalBudget += p.totalBudget;
      totalRevenue += p.totalRevenue;
      totalUnits += p.units.length;

      let pSold = 0;
      let pSaleAmount = 0;
      let pCollected = 0;

      p.units.forEach((u) => {
        if (u.status === "SATILDI" || u.status === "TESLIM_EDILDI") {
          pSold++;
          soldUnits++;
          if (u.sale) {
            pSaleAmount += u.sale.salePrice;
            totalSaleAmount += u.sale.salePrice;
            const collected = u.sale.payments.reduce((s, pay) => s + pay.paidAmount, 0);
            pCollected += collected;
            totalCollected += collected;
          }
        }
      });

      return {
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        city: p.city,
        totalUnits: p.units.length,
        soldUnits: pSold,
        completionPct: p.completionPct,
        totalBudget: p.totalBudget,
        saleAmount: pSaleAmount,
        collected: pCollected,
      };
    });

    totalPending = totalSaleAmount - totalCollected;

    // Geciken ödemeler
    const overduePayments = await prisma.paymentPlan.count({
      where: {
        status: "BEKLENIYOR",
        dueDate: { lt: new Date() },
      },
    });

    // Son 30 gün satışlar
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSales = await prisma.unitSale.count({
      where: {
        saleDate: { gte: thirtyDaysAgo },
      },
    });

    return NextResponse.json({
      summary: {
        totalProjects,
        activeProjects,
        totalBudget,
        totalRevenue,
        totalUnits,
        soldUnits,
        totalSaleAmount,
        totalCollected,
        totalPending,
        overduePayments,
        recentSales,
        occupancyRate: totalUnits > 0 ? Math.round((soldUnits / totalUnits) * 100) : 0,
      },
      projects: projectSummaries,
    });
  } catch (error) {
    console.error("Dashboard veri hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
