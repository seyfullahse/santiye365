import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Projeye atanmış çalışanları getir
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    // 1) ProjectWorkerAssignment ile atanmış çalışanlar
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignmentResult = assignments.map((a: any) => ({
      assignmentId: a.id,
      assignedAt: a.assignedAt,
      ...a.worker,
    }));

    // 2) Team.projectId üzerinden ilişkili ama henüz ProjectWorkerAssignment'ta olmayan çalışanlar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignedWorkerIds = new Set(assignments.map((a: any) => a.workerId));

    // Projeden çıkarılmış (isActive: false) çalışanları da hariç tut
    const removedAssignments = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, isActive: false },
      select: { workerId: true },
    });
    const removedWorkerIds = removedAssignments.map((r: { workerId: string }) => r.workerId);
    const excludeIds = [...Array.from(assignedWorkerIds), ...removedWorkerIds];

    const teamWorkers = await prisma.worker.findMany({
      where: {
        isActive: true,
        team: { projectId },
        id: { notIn: excludeIds.length > 0 ? excludeIds : ["_none_"] },
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, type: true, sortOrder: true } },
            discipline: { select: { name: true } },
          },
        },
      },
      orderBy: [
        { team: { company: { sortOrder: "asc" } } },
        { team: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { lastName: "asc" },
      ],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teamResult = teamWorkers.map((w: any) => ({
      assignmentId: null,
      assignedAt: null,
      ...w,
    }));

    // Her iki kaynağı birleştir
    const result = [...assignmentResult, ...teamResult];

    return NextResponse.json(result);
  } catch (error) {
    console.error("Atama listesi alınamadı:", error);
    return NextResponse.json({ error: "Atamalar yüklenemedi" }, { status: 500 });
  }
}

// POST: Çalışanları projeye ata (toplu)
// workerIds → mevcut Worker kayıtlarını ata (taşeron)
// employeeIds → İK Employee'den Worker oluşturup ata (ana firma)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { workerIds = [], employeeIds = [] } = body as {
      workerIds?: string[];
      employeeIds?: string[];
    };

    if (workerIds.length === 0 && employeeIds.length === 0) {
      return NextResponse.json({ error: "Çalışan veya personel ID listesi gerekli" }, { status: 400 });
    }

    const finalWorkerIds: string[] = [...workerIds];

    // ═══ İK Employee → Worker oto-oluştur (ana firma) ═══
    if (employeeIds.length > 0) {
      // Employee verilerini çek
      const employees = await prisma.employee.findMany({
        where: { id: { in: employeeIds } },
        include: {
          company: { select: { id: true, name: true } },
          position: { select: { name: true } },
          team: { select: { id: true } },
        },
      });

      // Halihazırda Worker kaydı olan employee'leri bul
      const existingWorkers = await prisma.worker.findMany({
        where: { employeeId: { in: employeeIds } },
        select: { id: true, employeeId: true },
      });
      const existingWorkerMap = new Map<string, string>(
        existingWorkers
          .filter((w: { employeeId: string | null }) => w.employeeId != null)
          .map((w: { employeeId: string | null; id: string }) => [w.employeeId!, w.id])
      );

      // Projeye bağlı ana firma ekibini bul / oluştur
      let defaultTeamId: string | null = null;
      const getOrCreateDefaultTeam = async (companyId: string) => {
        if (defaultTeamId) return defaultTeamId;
        // Önce projeye bağlı ana firma ekibi ara
        const existing = await prisma.team.findFirst({
          where: { companyId, projectId },
        });
        if (existing) {
          defaultTeamId = existing.id;
          return defaultTeamId;
        }
        // Herhangi bir projeye bağlı olmayan ana firma ekibi ara
        const anyTeam = await prisma.team.findFirst({
          where: { companyId },
        });
        if (anyTeam) {
          defaultTeamId = anyTeam.id;
          return defaultTeamId;
        }
        return null;
      };

      for (const emp of employees) {
        // Zaten Worker kaydı varsa onu kullan
        if (existingWorkerMap.has(emp.id)) {
          finalWorkerIds.push(existingWorkerMap.get(emp.id)!);
          continue;
        }

        // teamId: Employee'nin ekibi, yoksa proje-bağlı ana firma ekibi
        let teamId = emp.team?.id || null;
        if (!teamId && emp.companyId) {
          teamId = await getOrCreateDefaultTeam(emp.companyId);
        }
        if (!teamId) {
          console.warn(`Employee ${emp.id} için ekip bulunamadı, atlanamıyor`);
          continue;
        }

        // Yeni Worker oluştur (İK Employee'den)
        const newWorker = await prisma.worker.create({
          data: {
            teamId,
            employeeId: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            role: emp.position?.name || "Personel",
            collarType: "WHITE",
            identityNo: emp.tcNo || null,
            phone: emp.phone || null,
            position: emp.position?.name || null,
            bloodType: emp.bloodType || null,
            startDate: emp.hireDate || null,
          },
        });
        finalWorkerIds.push(newWorker.id);
      }
    }

    if (finalWorkerIds.length === 0) {
      return NextResponse.json({ error: "Atanacak geçerli çalışan bulunamadı" }, { status: 400 });
    }

    // Upsert: zaten atanmış olanları tekrar aktifleştir, yenileri ekle
    const results = await Promise.all(
      finalWorkerIds.map((workerId) =>
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
    // upsert: assignment kaydı yoksa (takım üzerinden gelen) bile çıkarma kaydı oluştur
    await prisma.projectWorkerAssignment.upsert({
      where: { projectId_workerId: { projectId, workerId } },
      update: { isActive: false, removedAt: new Date() },
      create: { projectId, workerId, isActive: false, removedAt: new Date() },
    });

    return NextResponse.json({ message: "Çalışan projeden çıkarıldı" });
  } catch (error) {
    console.error("Çıkarma hatası:", error);
    return NextResponse.json({ error: "Çalışan çıkarılamadı" }, { status: 500 });
  }
}
