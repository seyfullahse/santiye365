import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Devam eden (gelen) statüler
const PRESENT_STATUSES = ["PRESENT", "HALF_DAY", "REST_DAY_WORK"];
// İzinli statüler (hepsi)
const LEAVE_STATUSES = [
  "PAID_LEAVE",
  "UNPAID_LEAVE",
  "ANNUAL_LEAVE",
  "SICK_LEAVE",
  "ADMINISTRATIVE_LEAVE",
  "DAY_OFF",
];

export async function GET(req: NextRequest) {
  const startDate = req.nextUrl.searchParams.get("startDate");
  const endDate = req.nextUrl.searchParams.get("endDate");

  if (!startDate || !endDate) {
    return NextResponse.json(
      { error: "startDate ve endDate parametreleri gereklidir" },
      { status: 400 }
    );
  }

  try {
    const start = new Date(startDate + "T00:00:00.000Z");
    const end = new Date(endDate + "T00:00:00.000Z");

    // Tüm aktif çalışanlar
    const allWorkers = await prisma.worker.findMany({
      where: { isActive: true },
      select: {
        id: true,
        collarType: true,
        team: {
          select: {
            projectId: true,
            project: { select: { id: true, name: true } },
            company: { select: { type: true, name: true } },
          },
        },
      },
    });

    // ProjectWorkerAssignment ile proje atanan çalışanlar
    const assignments = await prisma.projectWorkerAssignment.findMany({
      where: { isActive: true },
      select: {
        workerId: true,
        projectId: true,
        project: { select: { id: true, name: true } },
      },
    });

    // Çalışan meta bilgileri
    const workerMeta = new Map<string, {
      companyType: string;
      collarType: string;
      projectId: string | null;
      projectName: string | null;
    }>();

    for (const w of allWorkers) {
      workerMeta.set(w.id, {
        companyType: w.team?.company?.type ?? "MAIN",
        collarType: w.collarType ?? "BLUE",
        projectId: w.team?.project?.id ?? null,
        projectName: w.team?.project?.name ?? null,
      });
    }
    // Assignment override
    for (const a of assignments) {
      const existing = workerMeta.get(a.workerId);
      if (existing) {
        existing.projectId = a.project.id;
        existing.projectName = a.project.name;
      }
    }

    const workerIds = allWorkers.map((w: { id: string }) => w.id);

    // Tarih aralığındaki tüm yoklamalar
    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: start, lte: end },
        workerId: { in: workerIds.length > 0 ? workerIds : ["_none_"] },
      },
      select: {
        workerId: true,
        date: true,
        status: true,
        totalHours: true,
        overtime: true,
      },
    });

    // ─── Proje bazlı, firma ayrımlı istatistik ───
    type ProjectStatEntry = {
      projectId: string;
      projectName: string;
      // Ana firma
      mainTotal: number;
      mainWhite: number;
      mainBlue: number;
      mainPresent: number;
      mainAbsent: number;
      mainAdminLeave: number;
      mainDayOff: number;
      mainRestDayWork: number;
      mainOtherLeave: number;
      mainHours: number;
      mainOvertime: number;
      // Taşeron
      subTotal: number;
      subWhite: number;
      subBlue: number;
      subPresent: number;
      subAbsent: number;
      subHours: number;
      subOvertime: number;
      // Tracking
      mainWorkerIds: Set<string>;
      subWorkerIds: Set<string>;
    };

    const projectMap = new Map<string, ProjectStatEntry>();

    function getOrCreateProject(pid: string, pname: string): ProjectStatEntry {
      if (!projectMap.has(pid)) {
        projectMap.set(pid, {
          projectId: pid,
          projectName: pname,
          mainTotal: 0, mainWhite: 0, mainBlue: 0,
          mainPresent: 0, mainAbsent: 0,
          mainAdminLeave: 0, mainDayOff: 0, mainRestDayWork: 0, mainOtherLeave: 0,
          mainHours: 0, mainOvertime: 0,
          subTotal: 0, subWhite: 0, subBlue: 0,
          subPresent: 0, subAbsent: 0,
          subHours: 0, subOvertime: 0,
          mainWorkerIds: new Set(),
          subWorkerIds: new Set(),
        });
      }
      return projectMap.get(pid)!;
    }

    // Genel toplamlar (firma bazlı)
    let mainTotalWorkers = 0, mainWhiteWorkers = 0, mainBlueWorkers = 0;
    let subTotalWorkers = 0, subWhiteWorkers = 0, subBlueWorkers = 0;
    let mainPresent = 0, mainAbsent = 0, mainAdminLeave = 0, mainDayOff = 0, mainRestDayWork = 0, mainOtherLeave = 0;
    let mainHours = 0, mainOvertime = 0;
    let subPresent = 0, subAbsent = 0, subHours = 0, subOvertime = 0;

    // Çalışan sayılarını hesapla
    for (const [, meta] of workerMeta) {
      if (meta.companyType === "SUBCONTRACTOR") {
        subTotalWorkers++;
        if (meta.collarType === "WHITE") subWhiteWorkers++;
        else subBlueWorkers++;
      } else {
        mainTotalWorkers++;
        if (meta.collarType === "WHITE") mainWhiteWorkers++;
        else mainBlueWorkers++;
      }
    }

    // Gün gün genel istatistik
    const dayMap = new Map<string, {
      present: number; absent: number; leave: number; total: number; hours: number; overtime: number;
    }>();

    // Yoklama verilerini işle
    for (const att of attendances) {
      const meta = workerMeta.get(att.workerId);
      if (!meta) continue;

      const dateStr = att.date.toISOString().slice(0, 10);
      const isMain = meta.companyType !== "SUBCONTRACTOR";

      // Gün bazlı genel
      if (!dayMap.has(dateStr)) {
        dayMap.set(dateStr, { present: 0, absent: 0, leave: 0, total: 0, hours: 0, overtime: 0 });
      }
      const day = dayMap.get(dateStr)!;
      day.total++;

      if (PRESENT_STATUSES.includes(att.status)) {
        day.present++;
      } else if (att.status === "ABSENT") {
        day.absent++;
      } else if (LEAVE_STATUSES.includes(att.status)) {
        day.leave++;
      }
      day.hours += att.totalHours;
      day.overtime += att.overtime;

      // Firma bazlı genel toplamlar
      if (isMain) {
        if (PRESENT_STATUSES.includes(att.status)) mainPresent++;
        else if (att.status === "ABSENT") mainAbsent++;
        else if (att.status === "ADMINISTRATIVE_LEAVE") mainAdminLeave++;
        else if (att.status === "DAY_OFF") mainDayOff++;
        if (att.status === "REST_DAY_WORK") mainRestDayWork++;
        if (!PRESENT_STATUSES.includes(att.status) && att.status !== "ABSENT" && att.status !== "ADMINISTRATIVE_LEAVE" && att.status !== "DAY_OFF") {
          if (LEAVE_STATUSES.includes(att.status)) mainOtherLeave++;
        }
        mainHours += att.totalHours;
        mainOvertime += att.overtime;
      } else {
        if (PRESENT_STATUSES.includes(att.status)) subPresent++;
        else if (att.status === "ABSENT") subAbsent++;
        subHours += att.totalHours;
        subOvertime += att.overtime;
      }

      // Proje bazlı
      if (meta.projectId && meta.projectName) {
        const pe = getOrCreateProject(meta.projectId, meta.projectName);
        if (isMain) {
          pe.mainWorkerIds.add(att.workerId);
          if (PRESENT_STATUSES.includes(att.status)) pe.mainPresent++;
          else if (att.status === "ABSENT") pe.mainAbsent++;
          else if (att.status === "ADMINISTRATIVE_LEAVE") pe.mainAdminLeave++;
          else if (att.status === "DAY_OFF") pe.mainDayOff++;
          if (att.status === "REST_DAY_WORK") pe.mainRestDayWork++;
          if (!PRESENT_STATUSES.includes(att.status) && att.status !== "ABSENT" && att.status !== "ADMINISTRATIVE_LEAVE" && att.status !== "DAY_OFF") {
            if (LEAVE_STATUSES.includes(att.status)) pe.mainOtherLeave++;
          }
          pe.mainHours += att.totalHours;
          pe.mainOvertime += att.overtime;
        } else {
          pe.subWorkerIds.add(att.workerId);
          if (PRESENT_STATUSES.includes(att.status)) pe.subPresent++;
          else if (att.status === "ABSENT") pe.subAbsent++;
          pe.subHours += att.totalHours;
          pe.subOvertime += att.overtime;
        }
      }
    }

    // Proje çalışan sayıları (kişi bazlı - unique)
    for (const pe of projectMap.values()) {
      pe.mainTotal = pe.mainWorkerIds.size;
      pe.subTotal = pe.subWorkerIds.size;
      // Yaka ayırımı
      for (const wid of pe.mainWorkerIds) {
        const m = workerMeta.get(wid);
        if (m?.collarType === "WHITE") pe.mainWhite++;
        else pe.mainBlue++;
      }
      for (const wid of pe.subWorkerIds) {
        const m = workerMeta.get(wid);
        if (m?.collarType === "WHITE") pe.subWhite++;
        else pe.subBlue++;
      }
    }

    // Gün gün sıralı
    const dailyStats = Array.from(dayMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        present: d.present,
        absent: d.absent,
        leave: d.leave,
        total: d.total,
        hours: Math.round(d.hours * 10) / 10,
        overtime: Math.round(d.overtime * 10) / 10,
      }));

    const totalDays = dailyStats.length;

    // Proje bazlı sonuçlar (sıralı)
    const projects = Array.from(projectMap.values())
      .sort((a, b) => a.projectName.localeCompare(b.projectName, "tr"))
      .map((pe) => ({
        projectId: pe.projectId,
        projectName: pe.projectName,
        main: {
          workers: pe.mainTotal,
          white: pe.mainWhite,
          blue: pe.mainBlue,
          present: pe.mainPresent,
          absent: pe.mainAbsent,
          adminLeave: pe.mainAdminLeave,
          dayOff: pe.mainDayOff,
          restDayWork: pe.mainRestDayWork,
          otherLeave: pe.mainOtherLeave,
          hours: Math.round(pe.mainHours * 10) / 10,
          overtime: Math.round(pe.mainOvertime * 10) / 10,
        },
        sub: {
          workers: pe.subTotal,
          white: pe.subWhite,
          blue: pe.subBlue,
          present: pe.subPresent,
          absent: pe.subAbsent,
          hours: Math.round(pe.subHours * 10) / 10,
          overtime: Math.round(pe.subOvertime * 10) / 10,
        },
      }));

    const result = {
      totalDays,
      dailyStats,
      mainCompany: {
        totalWorkers: mainTotalWorkers,
        white: mainWhiteWorkers,
        blue: mainBlueWorkers,
        present: mainPresent,
        absent: mainAbsent,
        adminLeave: mainAdminLeave,
        dayOff: mainDayOff,
        restDayWork: mainRestDayWork,
        otherLeave: mainOtherLeave,
        hours: Math.round(mainHours * 10) / 10,
        overtime: Math.round(mainOvertime * 10) / 10,
      },
      subCompany: {
        totalWorkers: subTotalWorkers,
        white: subWhiteWorkers,
        blue: subBlueWorkers,
        present: subPresent,
        absent: subAbsent,
        hours: Math.round(subHours * 10) / 10,
        overtime: Math.round(subOvertime * 10) / 10,
      },
      projects,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("İstatistik veri hatası:", error);
    return NextResponse.json(
      { error: "İstatistik verileri alınamadı" },
      { status: 500 }
    );
  }
}
