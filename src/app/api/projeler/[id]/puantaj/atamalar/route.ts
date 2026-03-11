import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Projeye atanmış çalışanları getir
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const assignments = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, isActive: true },
      include: {
        worker: {
          include: {
            team: {
              include: {
                company: { select: { id: true, name: true, type: true, sortOrder: true } },
                discipline: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });

    const result = assignments.map((a) => ({
      assignmentId: a.id,
      assignedAt: a.assignedAt,
      ...a.worker,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Atama listesi alınamadı:", error);
    return NextResponse.json({ error: "Atamalar yüklenemedi" }, { status: 500 });
  }
}

// POST: Çalışanları projeye ata (toplu)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { workerIds } = body as { workerIds: string[] };

    if (!workerIds || workerIds.length === 0) {
      return NextResponse.json({ error: "Çalışan ID listesi gerekli" }, { status: 400 });
    }

    // Upsert: zaten atanmış olanları tekrar aktifleştir, yenileri ekle
    const results = await Promise.all(
      workerIds.map((workerId) =>
        prisma.projectWorkerAssignment.upsert({
          where: { projectId_workerId: { projectId, workerId } },
          update: { isActive: true, removedAt: null },
          create: { projectId, workerId },
        })
      )
    );

    return NextResponse.json({ count: results.length, message: `${results.length} çalışan atandı` });
  } catch (error) {
    console.error("Atama hatası:", error);
    return NextResponse.json({ error: "Atama yapılamadı" }, { status: 500 });
  }
}

// DELETE: Çalışanı projeden çıkar
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const workerId = req.nextUrl.searchParams.get("workerId");

  if (!workerId) {
    return NextResponse.json({ error: "workerId parametresi gerekli" }, { status: 400 });
  }

  try {
    await prisma.projectWorkerAssignment.update({
      where: { projectId_workerId: { projectId, workerId } },
      data: { isActive: false, removedAt: new Date() },
    });

    return NextResponse.json({ message: "Çalışan projeden çıkarıldı" });
  } catch (error) {
    console.error("Çıkarma hatası:", error);
    return NextResponse.json({ error: "Çalışan çıkarılamadı" }, { status: 500 });
  }
}
