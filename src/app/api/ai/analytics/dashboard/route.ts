// @ts-nocheck
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getProjectDelayRisk,
  getCostDeviation,
  getRiskAnalysis,
  getProjectSummary,
  getWorkforceStats,
  getSubcontractorPerformance,
} from "@/lib/ai-analytics";

// GET — Dashboard için önceden hesaplanmış metrikler
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Oturum gerekli" }, { status: 401 });
    }

    // Tüm verileri paralel çek
    const [projectSummary, delayRisk, costDeviation, riskAnalysis, workforce, subcontractors] =
      await Promise.all([
        getProjectSummary(),
        getProjectDelayRisk(),
        getCostDeviation(undefined, 6),
        getRiskAnalysis(),
        getWorkforceStats(undefined, 30),
        getSubcontractorPerformance(),
      ]);

    // Genel KPI'lar
    const totalProjects = projectSummary.length;
    const avgProgress =
      totalProjects > 0
        ? Math.round(
            (projectSummary.reduce((s, p) => s + p.progress, 0) / totalProjects) * 10
          ) / 10
        : 0;

    const criticalProjects = delayRisk.filter((d) => d.riskLevel === "CRITICAL").length;
    const highRiskProjects = delayRisk.filter((d) => d.riskLevel === "HIGH").length;

    return NextResponse.json({
      kpis: {
        totalProjects,
        avgProgress,
        criticalProjects,
        highRiskProjects,
        compositeRisk: riskAnalysis.compositeScore,
        riskLevel: riskAnalysis.overallLevel,
        totalBudget: costDeviation.totalBudget,
        totalRealized: costDeviation.totalRealized,
        averageWorkers: workforce.averageDaily,
        openRisks: riskAnalysis.risks.open,
        totalAccidents: riskAnalysis.safety.totalAccidents,
        lostDays: riskAnalysis.safety.lostDays,
      },
      projects: projectSummary.map((p) => {
        const delay = delayRisk.find((d) => d.projectId === p.id);
        return {
          id: p.id,
          name: p.name,
          progress: p.progress,
          riskLevel: delay?.riskLevel || "LOW",
          deviation: delay?.deviation || 0,
          delayedActivities: delay?.delayedCount || 0,
        };
      }),
      riskBreakdown: riskAnalysis.breakdown,
      costSummary: costDeviation.projects.slice(0, 5),
      monthlyTrend: costDeviation.monthlyTrend,
      workforceTrend: workforce.dailyTrend.slice(-14), // Son 14 gün
      topSubcontractors: subcontractors.subcontractors.slice(0, 5),
      topRisks: riskAnalysis.risks.topRisks,
    });
  } catch (error) {
    console.error("Dashboard analytics hatası:", error);
    return NextResponse.json({ error: "Veriler yüklenemedi" }, { status: 500 });
  }
}
