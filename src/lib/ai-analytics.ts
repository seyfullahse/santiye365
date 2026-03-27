// @ts-nocheck
/**
 * AI & Analitik — Güvenli Sorgu Fonksiyonları
 * OpenAI function calling ile çağrılabilecek, önceden tanımlı Prisma sorguları.
 * AI bu fonksiyonları doğrudan çağıramaz; API katmanı üzerinden parametreler iletilir.
 */

import { prisma } from "@/lib/prisma";

/* ═══════════════════════════════════════════════════════════════
   1. GECİKME TAHMİNİ
   ═══════════════════════════════════════════════════════════════ */

export async function getProjectDelayRisk(projectId?: string) {
  const where = projectId
    ? { projectId, status: "ACTIVE" as const }
    : { project: { status: "ACTIVE" as const } };

  const projects = await prisma.project.findMany({
    where: { status: "ACTIVE", ...(projectId ? { id: projectId } : {}) },
    select: {
      id: true,
      name: true,
      startDate: true,
      endDate: true,
      activities: {
        select: {
          id: true,
          name: true,
          weight: true,
          progressPercent: true,
          plannedStart: true,
          plannedFinish: true,
          forecastFinish: true,
          actualFinish: true,
          isCritical: true,
          status: true,
        },
      },
    },
  });

  const now = new Date();

  return projects.map((project) => {
    const activities = project.activities;
    const totalWeight = activities.reduce((s, a) => s + a.weight, 0);

    // Genel ilerleme (ağırlıklı)
    const actualProgress =
      totalWeight > 0
        ? activities.reduce((s, a) => s + a.weight * a.progressPercent, 0) / totalWeight
        : 0;

    // Planlanan ilerleme (bugüne kadar bitmesi gereken aktiviteler)
    const plannedProgress =
      totalWeight > 0
        ? activities
            .filter((a) => a.plannedFinish && new Date(a.plannedFinish) <= now)
            .reduce((s, a) => s + a.weight, 0) / totalWeight * 100
        : 0;

    // Sapma
    const deviation = actualProgress - plannedProgress;

    // Geciken aktiviteler
    const delayedActivities = activities.filter((a) => {
      if (a.status === "COMPLETED") return false;
      if (!a.plannedFinish) return false;
      return new Date(a.plannedFinish) < now && a.progressPercent < 100;
    });

    // Kritik yol gecikmeleri
    const criticalDelays = delayedActivities.filter((a) => a.isCritical);

    // Tahmini bitiş hesapla
    let estimatedCompletion: string | null = null;
    if (project.endDate && totalWeight > 0 && actualProgress > 0) {
      const elapsed = now.getTime() - (project.startDate?.getTime() || now.getTime());
      const estimatedTotal = elapsed / (actualProgress / 100);
      const estDate = new Date((project.startDate?.getTime() || now.getTime()) + estimatedTotal);
      estimatedCompletion = estDate.toISOString();
    }

    // Risk seviyesi
    const delayRatio = delayedActivities.length / Math.max(activities.length, 1);
    let riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
    if (criticalDelays.length > 0 || deviation < -20) riskLevel = "CRITICAL";
    else if (delayRatio > 0.3 || deviation < -10) riskLevel = "HIGH";
    else if (delayRatio > 0.1 || deviation < -5) riskLevel = "MEDIUM";

    return {
      projectId: project.id,
      projectName: project.name,
      plannedEnd: project.endDate?.toISOString() || null,
      estimatedCompletion,
      actualProgress: Math.round(actualProgress * 10) / 10,
      plannedProgress: Math.round(plannedProgress * 10) / 10,
      deviation: Math.round(deviation * 10) / 10,
      totalActivities: activities.length,
      delayedCount: delayedActivities.length,
      criticalDelayCount: criticalDelays.length,
      riskLevel,
      delayedActivities: delayedActivities.slice(0, 5).map((a) => ({
        name: a.name,
        progress: a.progressPercent,
        plannedFinish: a.plannedFinish?.toISOString(),
        isCritical: a.isCritical,
      })),
    };
  });
}

/* ═══════════════════════════════════════════════════════════════
   2. MALİYET SAPMA ANALİZİ
   ═══════════════════════════════════════════════════════════════ */

export async function getCostDeviation(projectId?: string, months?: number) {
  const periodMonths = months || 6;

  // Sözleşme toplamları
  const contracts = await prisma.hakedisContract.findMany({
    where: projectId ? { projectId } : {},
    select: {
      id: true,
      projectId: true,
      project: { select: { name: true } },
      name: true,
      type: true,
      totalAmount: true,
      currency: true,
    },
  });

  // Hakediş gerçekleşmeleri
  const since = new Date();
  since.setMonth(since.getMonth() - periodMonths);

  const hakedisler = await prisma.hakedis.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      createdAt: { gte: since },
    },
    select: {
      id: true,
      projectId: true,
      contractId: true,
      type: true,
      no: true,
      period: true,
      totalAmount: true,
      currentAmount: true,
      previousAmount: true,
      netAmount: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Proje bazlı sözleşme toplamları
  const projectBudgets: Record<string, { name: string; budget: number; realized: number; net: number }> = {};

  for (const c of contracts) {
    if (!projectBudgets[c.projectId]) {
      projectBudgets[c.projectId] = {
        name: c.project.name,
        budget: 0,
        realized: 0,
        net: 0,
      };
    }
    projectBudgets[c.projectId].budget += c.totalAmount;
  }

  for (const h of hakedisler) {
    if (projectBudgets[h.projectId]) {
      projectBudgets[h.projectId].realized += h.totalAmount;
      projectBudgets[h.projectId].net += h.netAmount;
    }
  }

  // Aylık trend
  const monthlyTrend: { month: string; amount: number; count: number }[] = [];
  for (const h of hakedisler) {
    const m = h.period || new Date(h.createdAt).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
    const existing = monthlyTrend.find((t) => t.month === m);
    if (existing) {
      existing.amount += h.currentAmount;
      existing.count++;
    } else {
      monthlyTrend.push({ month: m, amount: h.currentAmount, count: 1 });
    }
  }

  const projectResults = Object.entries(projectBudgets).map(([pid, data]) => {
    const deviationPercent = data.budget > 0 ? ((data.realized - data.budget) / data.budget) * 100 : 0;
    const burnRate = data.budget > 0 ? (data.realized / data.budget) * 100 : 0;

    let status: "NORMAL" | "WARNING" | "CRITICAL" = "NORMAL";
    if (deviationPercent > 10 || burnRate > 90) status = "CRITICAL";
    else if (deviationPercent > 5 || burnRate > 75) status = "WARNING";

    return {
      projectId: pid,
      projectName: data.name,
      budget: Math.round(data.budget),
      realized: Math.round(data.realized),
      net: Math.round(data.net),
      deviationPercent: Math.round(deviationPercent * 10) / 10,
      burnRate: Math.round(burnRate * 10) / 10,
      status,
    };
  });

  return {
    projects: projectResults,
    monthlyTrend,
    totalBudget: Math.round(projectResults.reduce((s, p) => s + p.budget, 0)),
    totalRealized: Math.round(projectResults.reduce((s, p) => s + p.realized, 0)),
    totalNet: Math.round(projectResults.reduce((s, p) => s + p.net, 0)),
  };
}

/* ═══════════════════════════════════════════════════════════════
   3. RİSK ANALİZİ
   ═══════════════════════════════════════════════════════════════ */

export async function getRiskAnalysis(projectId?: string) {
  const risks = await prisma.risk.findMany({
    where: projectId ? { projectId } : {},
    select: {
      id: true,
      projectId: true,
      project: { select: { name: true } },
      title: true,
      impact: true,
      probability: true,
      score: true,
      action: true,
      responsible: true,
      status: true,
    },
  });

  // ISG kazaları
  const accidents = await prisma.workAccident.findMany({
    where: projectId ? { projectId } : {},
    select: {
      id: true,
      projectId: true,
      severity: true,
      lostDays: true,
      date: true,
      status: true,
    },
  });

  // Gecikme verileri (kısa)
  const delayData = await getProjectDelayRisk(projectId);

  // Risk dağılımı
  const openRisks = risks.filter((r) => r.status === "OPEN");
  const highRisks = openRisks.filter((r) => r.score >= 9);
  const mediumRisks = openRisks.filter((r) => r.score >= 4 && r.score < 9);
  const lowRisks = openRisks.filter((r) => r.score < 4);

  // ISG skoru — kaza ağırlıkları
  const severityWeights: Record<string, number> = {
    NEAR_MISS: 1,
    MINOR: 3,
    MODERATE: 5,
    SERIOUS: 10,
    FATAL: 25,
  };
  const safetyScore = accidents.reduce((s, a) => {
    return s + (severityWeights[a.severity] || 1) + (a.lostDays * 0.5);
  }, 0);

  // Bileşik risk skoru (0-100, düşük = iyi)
  const maxPossible = Math.max(openRisks.length * 25, 1);
  const riskScoreRaw = openRisks.reduce((s, r) => s + r.score, 0);
  const technicalRisk = Math.min((riskScoreRaw / maxPossible) * 100, 100);

  const delayRiskScore = delayData.reduce((s, d) => {
    if (d.riskLevel === "CRITICAL") return s + 30;
    if (d.riskLevel === "HIGH") return s + 20;
    if (d.riskLevel === "MEDIUM") return s + 10;
    return s;
  }, 0);
  const scheduleRisk = Math.min(delayRiskScore, 100);

  const safetyRiskNorm = Math.min((safetyScore / 50) * 100, 100);

  const compositeScore = Math.round(
    technicalRisk * 0.4 + scheduleRisk * 0.35 + safetyRiskNorm * 0.25
  );

  let overallLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW";
  if (compositeScore >= 70) overallLevel = "CRITICAL";
  else if (compositeScore >= 45) overallLevel = "HIGH";
  else if (compositeScore >= 20) overallLevel = "MEDIUM";

  return {
    compositeScore,
    overallLevel,
    breakdown: {
      technical: Math.round(technicalRisk),
      schedule: Math.round(scheduleRisk),
      safety: Math.round(safetyRiskNorm),
    },
    risks: {
      total: risks.length,
      open: openRisks.length,
      high: highRisks.length,
      medium: mediumRisks.length,
      low: lowRisks.length,
      topRisks: highRisks.slice(0, 5).map((r) => ({
        title: r.title,
        score: r.score,
        impact: r.impact,
        probability: r.probability,
        project: r.project.name,
        action: r.action,
      })),
    },
    safety: {
      totalAccidents: accidents.length,
      lostDays: accidents.reduce((s, a) => s + a.lostDays, 0),
      safetyScore: Math.round(safetyRiskNorm),
      bySeverity: {
        nearMiss: accidents.filter((a) => a.severity === "NEAR_MISS").length,
        minor: accidents.filter((a) => a.severity === "MINOR").length,
        moderate: accidents.filter((a) => a.severity === "MODERATE").length,
        serious: accidents.filter((a) => a.severity === "SERIOUS").length,
        fatal: accidents.filter((a) => a.severity === "FATAL").length,
      },
    },
  };
}

/* ═══════════════════════════════════════════════════════════════
   4. PROJE ÖZETİ (Genel bilgi)
   ═══════════════════════════════════════════════════════════════ */

export async function getProjectSummary(projectId?: string) {
  const projects = await prisma.project.findMany({
    where: projectId ? { id: projectId } : { status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      status: true,
      startDate: true,
      endDate: true,
      _count: {
        select: {
          zones: true,
          floors: true,
          activities: true,
          risks: true,
          hakedisler: true,
          employees: true,
          teams: true,
        },
      },
    },
  });

  const result = [];
  for (const p of projects) {
    const activities = await prisma.activity.findMany({
      where: { projectId: p.id },
      select: { weight: true, progressPercent: true, status: true },
    });
    const totalWeight = activities.reduce((s, a) => s + a.weight, 0);
    const progress =
      totalWeight > 0
        ? activities.reduce((s, a) => s + a.weight * a.progressPercent, 0) / totalWeight
        : 0;

    result.push({
      id: p.id,
      name: p.name,
      status: p.status,
      startDate: p.startDate?.toISOString(),
      endDate: p.endDate?.toISOString(),
      progress: Math.round(progress * 10) / 10,
      counts: p._count,
      activityBreakdown: {
        total: activities.length,
        completed: activities.filter((a) => a.status === "COMPLETED").length,
        inProgress: activities.filter((a) => a.status === "IN_PROGRESS").length,
        delayed: activities.filter((a) => a.status === "DELAYED").length,
        notStarted: activities.filter((a) => a.status === "NOT_STARTED").length,
      },
    });
  }

  return result;
}

/* ═══════════════════════════════════════════════════════════════
   5. İŞ GÜCÜ İSTATİSTİKLERİ
   ═══════════════════════════════════════════════════════════════ */

export async function getWorkforceStats(projectId?: string, days?: number) {
  const lookback = days || 30;
  const since = new Date();
  since.setDate(since.getDate() - lookback);

  const records = await prisma.workforceDaily.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      date: { gte: since },
    },
    select: {
      date: true,
      workerCount: true,
      projectId: true,
      project: { select: { name: true } },
    },
    orderBy: { date: "asc" },
  });

  // Günlük toplam
  const dailyMap: Record<string, number> = {};
  for (const r of records) {
    const d = new Date(r.date).toISOString().split("T")[0];
    dailyMap[d] = (dailyMap[d] || 0) + r.workerCount;
  }
  const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }));

  // Proje bazlı ortalama
  const projectMap: Record<string, { name: string; total: number; days: number }> = {};
  for (const r of records) {
    if (!projectMap[r.projectId]) {
      projectMap[r.projectId] = { name: r.project.name, total: 0, days: 0 };
    }
    projectMap[r.projectId].total += r.workerCount;
    projectMap[r.projectId].days++;
  }
  const byProject = Object.entries(projectMap).map(([id, d]) => ({
    projectId: id,
    projectName: d.name,
    averageWorkers: Math.round(d.total / Math.max(d.days, 1)),
    totalManDays: d.total,
  }));

  return {
    period: `Son ${lookback} gün`,
    dailyTrend,
    byProject,
    totalRecords: records.length,
    averageDaily: dailyTrend.length > 0
      ? Math.round(dailyTrend.reduce((s, d) => s + d.count, 0) / dailyTrend.length)
      : 0,
  };
}

/* ═══════════════════════════════════════════════════════════════
   6. TAŞERON PERFORMANSI
   ═══════════════════════════════════════════════════════════════ */

export async function getSubcontractorPerformance(companyId?: string) {
  const contracts = await prisma.hakedisContract.findMany({
    where: {
      type: "TASERON",
      ...(companyId ? { companyId } : {}),
    },
    select: {
      id: true,
      name: true,
      totalAmount: true,
      companyId: true,
      company: { select: { id: true, name: true } },
      project: { select: { id: true, name: true } },
    },
  });

  const hakedisler = await prisma.hakedis.findMany({
    where: {
      type: "TASERON",
      ...(companyId ? { companyId } : {}),
    },
    select: {
      contractId: true,
      companyId: true,
      totalAmount: true,
      netAmount: true,
      status: true,
    },
  });

  // Şirket bazlı
  const companyMap: Record<string, {
    name: string;
    contractTotal: number;
    realized: number;
    contracts: number;
  }> = {};

  for (const c of contracts) {
    const cid = c.companyId || "unknown";
    if (!companyMap[cid]) {
      companyMap[cid] = { name: c.company?.name || "Bilinmeyen", contractTotal: 0, realized: 0, contracts: 0 };
    }
    companyMap[cid].contractTotal += c.totalAmount;
    companyMap[cid].contracts++;
  }

  for (const h of hakedisler) {
    const cid = h.companyId || "unknown";
    if (companyMap[cid]) {
      companyMap[cid].realized += h.totalAmount;
    }
  }

  const results = Object.entries(companyMap).map(([id, d]) => ({
    companyId: id,
    companyName: d.name,
    contractTotal: Math.round(d.contractTotal),
    realized: Math.round(d.realized),
    completionRate: d.contractTotal > 0 ? Math.round((d.realized / d.contractTotal) * 100) : 0,
    contractCount: d.contracts,
  }));

  return {
    subcontractors: results.sort((a, b) => b.contractTotal - a.contractTotal),
    totalContractValue: Math.round(results.reduce((s, r) => s + r.contractTotal, 0)),
    totalRealized: Math.round(results.reduce((s, r) => s + r.realized, 0)),
  };
}

/* ═══════════════════════════════════════════════════════════════
   TOOL DEFINITIONS — OpenAI function calling şeması
   ═══════════════════════════════════════════════════════════════ */

export const AI_TOOL_DEFINITIONS = [
  {
    type: "function" as const,
    function: {
      name: "getProjectDelayRisk",
      description:
        "Projelerin gecikme risk analizi. Aktivite ilerlemesi, planlanan vs gerçekleşen karşılaştırması, geciken aktivite listesi ve risk seviyesi döner.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Belirli bir projenin ID'si. Boş bırakılırsa tüm aktif projeler analiz edilir.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getCostDeviation",
      description:
        "Maliyet sapma analizi. Sözleşme bütçesi vs hakediş gerçekleşmeleri, aylık trend, proje bazlı sapma yüzdeleri.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Belirli bir projenin ID'si. Boş bırakılırsa tüm projeler.",
          },
          months: {
            type: "number",
            description: "Kaç aylık veri getirilsin. Varsayılan 6.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getRiskAnalysis",
      description:
        "Bileşik risk analizi. Teknik riskler, gecikme riski ve İSG güvenlik skorunu birleştiren kapsamlı risk değerlendirmesi.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Belirli bir projenin ID'si. Boş bırakılırsa tüm projeler.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getProjectSummary",
      description:
        "Proje özet bilgileri. İlerleme yüzdesi, aktivite dağılımı, mahal/kat sayıları, ekip bilgileri.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Belirli bir projenin ID'si. Boş bırakılırsa tüm aktif projeler.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getWorkforceStats",
      description:
        "İş gücü istatistikleri. Günlük işçi sayısı trendi, proje bazlı ortalama, adam-gün toplamları.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "Belirli bir projenin ID'si.",
          },
          days: {
            type: "number",
            description: "Kaç günlük veri. Varsayılan 30.",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getSubcontractorPerformance",
      description:
        "Taşeron performans analizi. Sözleşme tutarları vs gerçekleşen ödemeler, tamamlanma oranları.",
      parameters: {
        type: "object",
        properties: {
          companyId: {
            type: "string",
            description: "Belirli bir taşeron şirketin ID'si. Boş bırakılırsa tüm taşeronlar.",
          },
        },
        required: [],
      },
    },
  },
];

/**
 * Tool çağrısını çalıştır — function adına göre ilgili sorgu fonksiyonunu çağırır
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function executeToolCall(name: string, args: Record<string, any>): Promise<any> {
  switch (name) {
    case "getProjectDelayRisk":
      return getProjectDelayRisk(args.projectId);
    case "getCostDeviation":
      return getCostDeviation(args.projectId, args.months);
    case "getRiskAnalysis":
      return getRiskAnalysis(args.projectId);
    case "getProjectSummary":
      return getProjectSummary(args.projectId);
    case "getWorkforceStats":
      return getWorkforceStats(args.projectId, args.days);
    case "getSubcontractorPerformance":
      return getSubcontractorPerformance(args.companyId);
    default:
      return { error: `Bilinmeyen fonksiyon: ${name}` };
  }
}
