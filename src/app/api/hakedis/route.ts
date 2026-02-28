import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Hakediş listesi (type, projectId, companyId filtre)
// Bu endpoint sadece özet sayfası için kullanılır
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // ISVEREN | TASERON
    const projectId = searchParams.get("projectId");
    const companyId = searchParams.get("companyId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (companyId) where.companyId = companyId;

    const hakedisler = await prisma.hakedis.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: [{ type: "asc" }, { no: "desc" }],
    });

    return NextResponse.json(hakedisler);
  } catch (error) {
    console.error("Hakediş listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
