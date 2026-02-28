import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ataşman kalemlerinin POZ bazlı toplamları (Yeşil Defter için)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json(
        { error: "contractId parametresi zorunludur" },
        { status: 400 }
      );
    }

    // Contract'a ait tüm ataşman kalemlerini POZ bazında grupla
    const toplamlar = await prisma.atasmanKalemi.groupBy({
      by: ["kesifKalemiId"],
      where: {
        atasman: {
          contractId,
        },
      },
      _sum: {
        miktar: true,
      },
    });

    const result = toplamlar.map((t) => ({
      kesifKalemiId: t.kesifKalemiId,
      toplamMiktar: t._sum.miktar || 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Ataşman toplamları hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
