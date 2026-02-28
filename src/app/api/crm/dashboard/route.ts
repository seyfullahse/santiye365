import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [
      totalCustomers,
      activeCustomers,
      totalOpportunities,
      opportunitiesByStage,
      recentCommunications,
      topCustomers,
      pipelineValue,
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: "ACTIVE" } }),
      prisma.opportunity.count(),
      prisma.opportunity.groupBy({
        by: ["stage"],
        _count: { id: true },
        _sum: { estimatedValue: true },
      }),
      prisma.communicationLog.findMany({
        orderBy: { contactDate: "desc" },
        take: 5,
        include: {
          customer: { select: { name: true } },
          opportunity: { select: { title: true } },
        },
      }),
      prisma.customer.findMany({
        take: 5,
        include: {
          _count: { select: { opportunities: true, projects: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.opportunity.aggregate({
        where: { stage: { notIn: ["LOST"] } },
        _sum: { estimatedValue: true },
      }),
    ]);

    // Yaklaşan takip tarihleri
    const upcomingFollowUps = await prisma.communicationLog.findMany({
      where: {
        nextFollowUp: { gte: new Date() },
      },
      orderBy: { nextFollowUp: "asc" },
      take: 5,
      include: {
        customer: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      totalCustomers,
      activeCustomers,
      totalOpportunities,
      opportunitiesByStage,
      recentCommunications,
      topCustomers,
      pipelineValue: pipelineValue._sum.estimatedValue || 0,
      upcomingFollowUps,
    });
  } catch (error) {
    console.error("CRM dashboard verileri alınamadı:", error);
    return NextResponse.json({ error: "Dashboard verileri alınamadı" }, { status: 500 });
  }
}
