import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get("customerId") || "";
    const opportunityId = searchParams.get("opportunityId") || "";

    const where: Record<string, unknown> = {};
    if (customerId) where.customerId = customerId;
    if (opportunityId) where.opportunityId = opportunityId;

    const logs = await prisma.communicationLog.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        opportunity: { select: { id: true, title: true } },
      },
      orderBy: { contactDate: "desc" },
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error("İletişim logları alınamadı:", error);
    return NextResponse.json({ error: "İletişim logları alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const log = await prisma.communicationLog.create({
      data: {
        customerId: body.customerId,
        opportunityId: body.opportunityId || null,
        type: body.type,
        subject: body.subject,
        content: body.content || null,
        contactDate: body.contactDate ? new Date(body.contactDate) : new Date(),
        nextFollowUp: body.nextFollowUp ? new Date(body.nextFollowUp) : null,
        createdBy: body.createdBy || null,
      },
    });
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error("İletişim logu oluşturulamadı:", error);
    return NextResponse.json({ error: "İletişim logu oluşturulamadı" }, { status: 500 });
  }
}
