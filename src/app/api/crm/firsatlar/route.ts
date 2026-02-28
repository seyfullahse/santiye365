import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const stage = searchParams.get("stage") || "";
    const customerId = searchParams.get("customerId") || "";

    const where: Record<string, unknown> = {};
    if (stage) where.stage = stage;
    if (customerId) where.customerId = customerId;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        _count: { select: { communications: true } },
      },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(opportunities);
  } catch (error) {
    console.error("Fırsatlar alınamadı:", error);
    return NextResponse.json({ error: "Fırsatlar alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const opportunity = await prisma.opportunity.create({
      data: {
        customerId: body.customerId,
        title: body.title,
        description: body.description || null,
        stage: body.stage || "LEAD",
        estimatedValue: body.estimatedValue || null,
        probability: body.probability || 0,
        expectedClose: body.expectedClose ? new Date(body.expectedClose) : null,
        source: body.source || null,
        assignedTo: body.assignedTo || null,
      },
    });
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error("Fırsat oluşturulamadı:", error);
    return NextResponse.json({ error: "Fırsat oluşturulamadı" }, { status: 500 });
  }
}
