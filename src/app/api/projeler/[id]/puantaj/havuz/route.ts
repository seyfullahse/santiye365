import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Projeye atanmamış aktif çalışanları getir (havuzdan eklenmek üzere)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const search = req.nextUrl.searchParams.get("search") || "";
  const companyType = req.nextUrl.searchParams.get("companyType") || "";

  try {
    // Zaten atanmış olanları bul (ProjectWorkerAssignment)
    const assigned = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, isActive: true },
      select: { workerId: true },
    });
    const assignedIds = assigned.map((a: { workerId: string }) => a.workerId);

    // Team.projectId üzerinden zaten projede olan çalışanları bul
    const teamWorkers = await prisma.worker.findMany({
      where: { isActive: true, team: { projectId } },
      select: { id: true },
    });
    const teamWorkerIds = teamWorkers.map((w: { id: string }) => w.id);

    // Her iki kaynaktan gelen ID'leri birleştir
    const excludeIds = [...new Set([...assignedIds, ...teamWorkerIds])];

    // Atanmamış aktif çalışanları getir
    const workers = await prisma.worker.findMany({
      where: {
        isActive: true,
        id: { notIn: excludeIds.length > 0 ? excludeIds : ["_none_"] },
        ...(companyType ? { team: { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" | "MANAGEMENT" } } } : {}),
        ...(search
          ? {
              OR: [
                { firstName: { contains: search, mode: "insensitive" } },
                { lastName: { contains: search, mode: "insensitive" } },
                { role: { contains: search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, type: true } },
            discipline: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { team: { company: { name: "asc" } } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
      take: 100,
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Atanmamış çalışanlar alınamadı:", error);
    return NextResponse.json({ error: "Çalışanlar yüklenemedi" }, { status: 500 });
  }
}
