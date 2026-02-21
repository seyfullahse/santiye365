import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  try {
    const risks = await prisma.risk.findMany({
      where: projectId ? { projectId } : undefined,
      include: {
        project: { select: { name: true } },
        activity: { select: { name: true } },
      },
      orderBy: { score: "desc" },
    });
    return NextResponse.json(risks);
  } catch (error) {
    console.error("Riskler alınamadı:", error);
    return NextResponse.json({ error: "Riskler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const score = (body.impact || 1) * (body.probability || 1);
    const risk = await prisma.risk.create({
      data: {
        projectId: body.projectId,
        activityId: body.activityId || null,
        title: body.title,
        impact: body.impact || 1,
        probability: body.probability || 1,
        score,
        action: body.action || null,
        responsible: body.responsible || null,
        status: "OPEN",
      },
    });
    return NextResponse.json(risk, { status: 201 });
  } catch (error) {
    console.error("Risk oluşturulamadı:", error);
    return NextResponse.json({ error: "Risk oluşturulamadı" }, { status: 500 });
  }
}
