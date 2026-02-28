import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const opportunity = await prisma.opportunity.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        communications: { orderBy: { contactDate: "desc" } },
      },
    });
    if (!opportunity) {
      return NextResponse.json({ error: "Fırsat bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Fırsat alınamadı:", error);
    return NextResponse.json({ error: "Fırsat alınamadı" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.stage !== undefined) {
      data.stage = body.stage;
      if (body.stage === "WON") data.wonDate = new Date();
      if (body.stage === "LOST") {
        data.lostDate = new Date();
        data.lostReason = body.lostReason || null;
      }
    }
    if (body.estimatedValue !== undefined) data.estimatedValue = body.estimatedValue;
    if (body.probability !== undefined) data.probability = body.probability;
    if (body.expectedClose !== undefined) data.expectedClose = body.expectedClose ? new Date(body.expectedClose) : null;
    if (body.source !== undefined) data.source = body.source;
    if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo;
    if (body.lostReason !== undefined) data.lostReason = body.lostReason;

    const opportunity = await prisma.opportunity.update({
      where: { id },
      data,
    });
    return NextResponse.json(opportunity);
  } catch (error) {
    console.error("Fırsat güncellenemedi:", error);
    return NextResponse.json({ error: "Fırsat güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.opportunity.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fırsat silinemedi:", error);
    return NextResponse.json({ error: "Fırsat silinemedi" }, { status: 500 });
  }
}
