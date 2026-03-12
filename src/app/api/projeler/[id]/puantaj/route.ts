import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Projeye atanmış çalışanların puantaj verilerini getir
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const date = req.nextUrl.searchParams.get("date");
  const endDate = req.nextUrl.searchParams.get("endDate");
  const shift = req.nextUrl.searchParams.get("shift");

  if (!date) {
    return NextResponse.json({ error: "Tarih parametresi gereklidir" }, { status: 400 });
  }

  try {
    const parsedStart = new Date(date + "T00:00:00.000Z");
    const parsedEnd = endDate ? new Date(endDate + "T00:00:00.000Z") : parsedStart;

    // 1) ProjectWorkerAssignment ile atanmış çalışanlar
    const assignments = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, isActive: true },
      select: { workerId: true },
    });
    const assignmentIds = assignments.map((a: { workerId: string }) => a.workerId);

    // 2) Team.projectId üzerinden ilişkili çalışanlar
    const teamWorkers = await prisma.worker.findMany({
      where: { isActive: true, team: { projectId } },
      select: { id: true },
    });
    const teamWorkerIds = teamWorkers.map((w: { id: string }) => w.id);

    // İki kaynağı birleştir (union)
    const idSet = new Set([...assignmentIds, ...teamWorkerIds]);
    const assignedWorkerIds = Array.from(idSet);

    if (assignedWorkerIds.length === 0) {
      return NextResponse.json([]);
    }

    // Atanmış çalışanların puantaj verilerini getir
    const workers = await prisma.worker.findMany({
      where: {
        id: { in: assignedWorkerIds },
        isActive: true,
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = workers.map((w: any) => ({
      id: w.id,
      firstName: w.firstName,
      lastName: w.lastName,
      role: w.role,
      sortOrder: w.sortOrder,
      team: w.team,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      attendances: w.attendances.map((att: any) => ({
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
    console.error("Proje puantaj verileri alınamadı:", error);
    return NextResponse.json({ error: "Veriler yüklenemedi" }, { status: 500 });
  }
}

// POST: Puantaj kaydı (mevcut /api/puantaj ile aynı mantık)
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;

  try {
    const body = await req.json();
    const { date, shift = "DAY", records } = body as {
      date: string;
      shift?: string;
      records: Array<{
        workerId: string;
        shift?: string;
        status: string;
        totalHours: number;
        overtime: number;
        note?: string;
      }>;
    };

    if (!date || !records?.length) {
      return NextResponse.json({ error: "Tarih ve kayıtlar gereklidir" }, { status: 400 });
    }

    // Projeye atanmış çalışanlar (her iki kaynak)
    const assignments = await prisma.projectWorkerAssignment.findMany({
      where: { projectId, isActive: true },
      select: { workerId: true },
    });
    const teamWorkers = await prisma.worker.findMany({
      where: { isActive: true, team: { projectId } },
      select: { id: true },
    });
    const assignedIds = new Set([
      ...assignments.map((a: { workerId: string }) => a.workerId),
      ...teamWorkers.map((w: { id: string }) => w.id),
    ]);

    const parsedDate = new Date(date + "T00:00:00.000Z");

    const results = await Promise.all(
      records
        .filter((r) => assignedIds.has(r.workerId))
        .map((record) =>
          prisma.attendance.upsert({
            where: {
              workerId_date_shift: {
                workerId: record.workerId,
                date: parsedDate,
                shift: (record.shift || shift) as "DAY" | "NIGHT",
              },
            },
            update: {
              status: record.status as any,
              totalHours: record.totalHours,
              overtime: record.overtime,
              note: record.note || null,
            },
            create: {
              workerId: record.workerId,
              date: parsedDate,
              shift: (record.shift || shift) as "DAY" | "NIGHT",
              status: record.status as any,
              totalHours: record.totalHours,
              overtime: record.overtime,
              note: record.note || null,
            },
          })
        )
    );

    return NextResponse.json({ count: results.length });
  } catch (error) {
    console.error("Puantaj kaydı hatası:", error);
    return NextResponse.json({ error: "Kayıt yapılamadı" }, { status: 500 });
  }
}
