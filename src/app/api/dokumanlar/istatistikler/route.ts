import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dokumanlar/istatistikler
 * Doküman modülü genel istatistikleri
 */
export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const [
      totalDocuments,
      totalFolders,
      totalVersions,
      byCategory,
      byStatus,
      pendingSign,
      recentDocuments,
      templateCount,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.documentFolder.count(),
      prisma.documentVersion.count(),
      prisma.document.groupBy({ by: ["category"], _count: true }),
      prisma.document.groupBy({ by: ["status"], _count: true }),
      prisma.document.count({ where: { requiresSign: true, signedAt: null } }),
      prisma.document.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          category: true,
          status: true,
          updatedAt: true,
          createdBy: { select: { name: true } },
        },
      }),
      prisma.document.count({ where: { isTemplate: true } }),
    ]);

    return NextResponse.json({
      totalDocuments,
      totalFolders,
      totalVersions,
      templateCount,
      pendingSign,
      byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
      recentDocuments,
    });
  } catch (error) {
    console.error("GET /api/dokumanlar/istatistikler error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
