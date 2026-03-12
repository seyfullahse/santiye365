import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Belirli bir tarih (veya tarih aralığı) ve ekip için puantaj verilerini getir
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date");
  const endDate = req.nextUrl.searchParams.get("endDate");
  const teamId = req.nextUrl.searchParams.get("teamId");
  const companyId = req.nextUrl.searchParams.get("companyId");
  const companyType = req.nextUrl.searchParams.get("companyType"); // MAIN | SUBCONTRACTOR | all
  const projectId = req.nextUrl.searchParams.get("projectId");
  const shift = req.nextUrl.searchParams.get("shift"); // DAY | NIGHT | all

  if (!date) {
    return NextResponse.json(
      { error: "Tarih parametresi gereklidir" },
      { status: 400 }
    );
  }

  try {
    const parsedStart = new Date(date + "T00:00:00.000Z");
    const parsedEnd = endDate
      ? new Date(endDate + "T00:00:00.000Z")
      : parsedStart;

    // Proje bazlı filtreleme: ProjectWorkerAssignment + Team.projectId üzerinden
    let assignedWorkerIds: string[] | null = null;
    if (projectId) {
      // 1) ProjectWorkerAssignment ile atanmış çalışanlar
      const assignments = await prisma.projectWorkerAssignment.findMany({
        where: { projectId, isActive: true },
        select: { workerId: true },
      });
      const assignmentIds = assignments.map((a) => a.workerId);

      // 2) Team.projectId üzerinden ilişkili çalışanlar
      const teamWorkers = await prisma.worker.findMany({
        where: { isActive: true, team: { projectId } },
        select: { id: true },
      });
      const teamWorkerIds = teamWorkers.map((w) => w.id);

      // İki kaynağı birleştir (union)
      const idSet = new Set([...assignmentIds, ...teamWorkerIds]);
      assignedWorkerIds = Array.from(idSet);
    }

    // Çalışanları getir (filtrelere göre)
    const workers = await prisma.worker.findMany({
      where: {
        isActive: true,
        ...(assignedWorkerIds !== null ? { id: { in: assignedWorkerIds } } : {}),
        ...(teamId ? { teamId } : {}),
        ...(companyId ? { team: { companyId } } : {}),
        ...(companyType && companyType !== "all" ? { team: { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" | "MANAGEMENT" } } } : {}),
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, type: true, sortOrder: true } },
            discipline: { select: { name: true } },
          },
        },
        attendances: {
          where: {
            date: { gte: parsedStart, lte: parsedEnd },
            ...(shift && shift !== "all" ? { shift: shift as "DAY" | "NIGHT" } : {}),
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

    // Çalışan + puantaj verisini birleştir
    const result = workers.map((w) => ({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      role: w.role,
      sortOrder: w.sortOrder,
      team: w.team,
      attendances: w.attendances.map((att) => ({
        id: att.id,
        date: att.date.toISOString().slice(0, 10),
        shift: att.shift,
        status: att.status,
        totalHours: att.totalHours,
        overtime: att.overtime,
        note: att.note,
      })),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Puantaj verileri alınamadı:", error);
    return NextResponse.json(
      { error: "Puantaj verileri alınamadı" },
      { status: 500 }
    );
  }
}

// POST: Toplu puantaj kaydet (upsert)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { date, shift: globalShift, records } = body as {
      date: string;
      shift?: "DAY" | "NIGHT";
      records: {
        workerId: string;
        shift?: "DAY" | "NIGHT";
        status: "PRESENT" | "HALF_DAY" | "ABSENT" | "PAID_LEAVE" | "UNPAID_LEAVE" | "ANNUAL_LEAVE" | "SICK_LEAVE" | "DAY_OFF" | "REST_DAY_WORK";
        totalHours: number;
        overtime: number;
        note?: string;
      }[];
    };

    if (!date || !records || !Array.isArray(records)) {
      return NextResponse.json(
        { error: "Tarih ve kayıtlar gereklidir" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date + "T00:00:00.000Z");

    // Her kayıt için upsert (varsa güncelle, yoksa oluştur)
    const results = await Promise.all(
      records.map((r) => {
        const shiftVal = r.shift || globalShift || "DAY";
        return prisma.attendance.upsert({
          where: {
            workerId_date_shift: {
              workerId: r.workerId,
              date: parsedDate,
              shift: shiftVal,
            },
          },
          update: {
            status: r.status,
            totalHours: r.totalHours ?? 0,
            overtime: r.overtime ?? 0,
            note: r.note ?? null,
          },
          create: {
            workerId: r.workerId,
            date: parsedDate,
            shift: shiftVal,
            status: r.status,
            totalHours: r.totalHours ?? 0,
            overtime: r.overtime ?? 0,
            note: r.note ?? null,
          },
        });
      })
    );

    return NextResponse.json({ saved: results.length });
  } catch (error) {
    console.error("Puantaj kaydedilemedi:", error);
    return NextResponse.json(
      { error: "Puantaj kaydedilemedi" },
      { status: 500 }
    );
  }
}
