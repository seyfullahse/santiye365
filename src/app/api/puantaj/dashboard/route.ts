import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Dashboard istatistikleri
export async function GET(req: NextRequest) {
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD (bugün)
  const month = req.nextUrl.searchParams.get("month"); // YYYY-MM
  const companyType = req.nextUrl.searchParams.get("companyType"); // MAIN | SUBCONTRACTOR | null=all

  if (!date || !month) {
    return NextResponse.json(
      { error: "date ve month parametreleri gereklidir" },
      { status: 400 }
    );
  }

  try {
    const todayDate = new Date(date + "T00:00:00.000Z");
    const [yearStr, monthStr] = month.split("-");
    const year = parseInt(yearStr);
    const mon = parseInt(monthStr) - 1;
    const monthStart = new Date(year, mon, 1);
    const monthEnd = new Date(year, mon + 1, 0);
    const monthStartUTC = new Date(monthStart.toISOString().slice(0, 10) + "T00:00:00.000Z");
    const monthEndUTC = new Date(monthEnd.toISOString().slice(0, 10) + "T00:00:00.000Z");

    // companyType filtresi için worker where koşulu
    const workerWhere = companyType && companyType !== "all"
      ? { isActive: true, team: { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" } } }
      : { isActive: true };
    const workerWhereAll = companyType && companyType !== "all"
      ? { team: { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" } } }
      : {};

    // Toplam çalışan sayıları
    const totalWorkers = await prisma.worker.count({ where: workerWhereAll });
    const activeWorkers = await prisma.worker.count({ where: workerWhere });

    // companyType'a göre worker ID'lerini al (attendance filtrelemek için)
    let workerIds: string[] | null = null;
    if (companyType && companyType !== "all") {
      const filteredWorkers = await prisma.worker.findMany({
        where: { isActive: true, team: { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" } } },
        select: { id: true },
      });
      workerIds = filteredWorkers.map((w: { id: string }) => w.id);
    }

    // Bugünkü yoklama durumu
    const todayAttendances = await prisma.attendance.findMany({
      where: {
        date: todayDate,
        ...(workerIds ? { workerId: { in: workerIds } } : {}),
      },
      select: { workerId: true, status: true },
    });
    let todayPresent = 0;
    let todayAbsent = 0;
    let todayHalfDay = 0;
    const todayAttMap = new Map<string, string>();
    for (const att of todayAttendances) {
      todayAttMap.set(att.workerId, att.status);
      if (att.status === "PRESENT" || att.status === "REST_DAY_WORK") todayPresent++;
      else if (att.status === "HALF_DAY") { todayPresent++; todayHalfDay++; }
      else if (att.status === "ABSENT") todayAbsent++;
    }

    // Aylık toplam saat / mesai
    const monthAgg = await prisma.attendance.aggregate({
      where: {
        date: { gte: monthStartUTC, lte: monthEndUTC },
        ...(workerIds ? { workerId: { in: workerIds } } : {}),
      },
      _sum: { totalHours: true, overtime: true },
    });
    const monthTotalHours = monthAgg._sum.totalHours ?? 0;
    const monthOvertime = monthAgg._sum.overtime ?? 0;

    // Firma / ekip sayısı
    const companyWhere = companyType && companyType !== "all"
      ? { type: companyType as "MAIN" | "SUBCONTRACTOR" }
      : {};
    const totalCompanies = await prisma.company.count({ where: companyWhere });
    const totalTeams = await prisma.team.count({
      where: companyType && companyType !== "all"
        ? { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" } }
        : {},
    });

    const stats = {
      totalWorkers,
      activeWorkers,
      todayPresent,
      todayAbsent,
      todayHalfDay,
      monthTotalHours,
      monthOvertime,
      totalCompanies,
      totalTeams,
    };

    // Ana Firma / Taşeron ayrımı için ek istatistikler
    const mainWorkers = await prisma.worker.findMany({
      where: { isActive: true, team: { company: { type: "MAIN" } } },
      select: { id: true },
    });
    const mainWorkerIds = mainWorkers.map((w: { id: string }) => w.id);

    const subWorkers = await prisma.worker.findMany({
      where: { isActive: true, team: { company: { type: "SUBCONTRACTOR" } } },
      select: { id: true },
    });
    const subWorkerIds = subWorkers.map((w: { id: string }) => w.id);

    // Bugünkü yoklama - ana firma
    let mainPresent = 0;
    let mainAbsent = 0;
    for (const id of mainWorkerIds) {
      const s = todayAttMap.get(id);
      if (s === "PRESENT" || s === "HALF_DAY" || s === "REST_DAY_WORK") mainPresent++;
      else if (s === "ABSENT") mainAbsent++;
      else if (!s) mainAbsent++; // Kaydı olmayan = gelmedi
    }

    // Bugünkü yoklama - taşeron
    let subPresent = 0;
    for (const id of subWorkerIds) {
      const s = todayAttMap.get(id);
      if (s === "PRESENT" || s === "HALF_DAY" || s === "REST_DAY_WORK") subPresent++;
    }

    // Aylık saat - ana firma
    const mainMonthAgg = await prisma.attendance.aggregate({
      where: {
        date: { gte: monthStartUTC, lte: monthEndUTC },
        workerId: { in: mainWorkerIds.length > 0 ? mainWorkerIds : ["_none_"] },
      },
      _sum: { totalHours: true, overtime: true },
    });

    // Aylık saat - taşeron
    const subMonthAgg = await prisma.attendance.aggregate({
      where: {
        date: { gte: monthStartUTC, lte: monthEndUTC },
        workerId: { in: subWorkerIds.length > 0 ? subWorkerIds : ["_none_"] },
      },
      _sum: { totalHours: true, overtime: true },
    });

    const mainCompanies = await prisma.company.findMany({ where: { type: "MAIN" }, select: { name: true }, orderBy: { sortOrder: "asc" } });
    const subCompanyCount = await prisma.company.count({ where: { type: "SUBCONTRACTOR" } });

    const mainStats = {
      totalWorkers: mainWorkerIds.length,
      todayPresent: mainPresent,
      todayAbsent: mainAbsent,
      monthTotalHours: mainMonthAgg._sum.totalHours ?? 0,
      monthOvertime: mainMonthAgg._sum.overtime ?? 0,
      totalCompanies: mainCompanies.length,
      companyName: mainCompanies.map((c: { name: string }) => c.name).join(", "),
    };

    const subStats = {
      totalWorkers: subWorkerIds.length,
      todayPresent: subPresent,
      monthTotalHours: subMonthAgg._sum.totalHours ?? 0,
      monthOvertime: subMonthAgg._sum.overtime ?? 0,
      totalCompanies: subCompanyCount,
    };

    // Proje bazlı istatistikler - HEM Team.projectId HEM ProjectWorkerAssignment kullan
    const teams = await prisma.team.findMany({
      where: companyType && companyType !== "all"
        ? { company: { type: companyType as "MAIN" | "SUBCONTRACTOR" } }
        : {},
      include: {
        project: { select: { id: true, name: true } },
        workers: {
          where: { isActive: true },
          select: { id: true },
        },
        company: { select: { id: true } },
      },
    });

    // ProjectWorkerAssignment'ları da al
    const allAssignments = await prisma.projectWorkerAssignment.findMany({
      where: {
        isActive: true,
        ...(workerIds ? { workerId: { in: workerIds } } : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        worker: {
          select: {
            id: true,
            isActive: true,
            team: { select: { companyId: true, company: { select: { id: true } } } },
          },
        },
      },
    });

    // Aylık çalışanlar bazlı saatler
    const monthAttByWorker = await prisma.attendance.groupBy({
      by: ["workerId"],
      where: {
        date: { gte: monthStartUTC, lte: monthEndUTC },
        ...(workerIds ? { workerId: { in: workerIds } } : {}),
      },
      _sum: { totalHours: true, overtime: true },
    });
    const monthHoursMap = new Map<string, { hours: number; overtime: number }>();
    for (const r of monthAttByWorker) {
      monthHoursMap.set(r.workerId, {
        hours: r._sum.totalHours ?? 0,
        overtime: r._sum.overtime ?? 0,
      });
    }

    // Proje bazlı grupla
    type ProjectEntry = {
      projectId: string | null;
      projectName: string;
      workers: Set<string>;
      companies: Set<string>;
      todayPresent: number;
      todayAbsent: number;
      monthHours: number;
      monthOvertime: number;
    };
    const projectMap = new Map<string, ProjectEntry>();

    // 1) Team.projectId üzerinden
    for (const team of teams) {
      const pid = team.project?.id ?? "unassigned";
      const pname = team.project?.name ?? "Proje Atanmamış";

      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: team.project?.id ?? null,
          projectName: pname,
          workers: new Set(),
          companies: new Set(),
          todayPresent: 0,
          todayAbsent: 0,
          monthHours: 0,
          monthOvertime: 0,
        });
      }

      const ps = projectMap.get(pid)!;
      ps.companies.add(team.company.id);

      for (const w of team.workers) {
        if (ps.workers.has(w.id)) continue; // Zaten eklenmişse atla
        ps.workers.add(w.id);
        const status = todayAttMap.get(w.id);
        if (status === "PRESENT" || status === "HALF_DAY" || status === "REST_DAY_WORK") ps.todayPresent++;
        else if (status === "ABSENT") ps.todayAbsent++;

        const mh = monthHoursMap.get(w.id);
        if (mh) {
          ps.monthHours += mh.hours;
          ps.monthOvertime += mh.overtime;
        }
      }
    }

    // 2) ProjectWorkerAssignment üzerinden (henüz eklenmemiş olanlar)
    for (const assignment of allAssignments) {
      if (!assignment.worker.isActive) continue;
      const pid = assignment.project.id;
      const pname = assignment.project.name;

      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: pid,
          projectName: pname,
          workers: new Set(),
          companies: new Set(),
          todayPresent: 0,
          todayAbsent: 0,
          monthHours: 0,
          monthOvertime: 0,
        });
      }

      const ps = projectMap.get(pid)!;
      ps.companies.add(assignment.worker.team.company.id);

      if (ps.workers.has(assignment.worker.id)) continue; // Zaten eklenmişse atla
      ps.workers.add(assignment.worker.id);
      const status = todayAttMap.get(assignment.worker.id);
      if (status === "PRESENT" || status === "HALF_DAY" || status === "REST_DAY_WORK") ps.todayPresent++;
      else if (status === "ABSENT") ps.todayAbsent++;

      const mh = monthHoursMap.get(assignment.worker.id);
      if (mh) {
        ps.monthHours += mh.hours;
        ps.monthOvertime += mh.overtime;
      }
    }

    const projectStats = Array.from(projectMap.values()).map((ps) => ({
      projectId: ps.projectId,
      projectName: ps.projectName,
      workerCount: ps.workers.size,
      todayPresent: ps.todayPresent,
      todayAbsent: ps.todayAbsent,
      monthHours: Math.round(ps.monthHours * 10) / 10,
      monthOvertime: Math.round(ps.monthOvertime * 10) / 10,
      companyCount: ps.companies.size,
    }));

    return NextResponse.json({ stats, mainStats, subStats, projectStats });
  } catch (error) {
    console.error("Dashboard veri hatası:", error);
    return NextResponse.json({ error: "Dashboard verileri alınamadı" }, { status: 500 });
  }
}
