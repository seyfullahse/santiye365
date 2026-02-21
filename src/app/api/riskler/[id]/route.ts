import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const score = (body.impact || 1) * (body.probability || 1);
    const risk = await prisma.risk.update({
      where: { id },
      data: {
        title: body.title,
        impact: body.impact,
        probability: body.probability,
        score,
        action: body.action,
        responsible: body.responsible,
        status: body.status,
      },
    });
    return NextResponse.json(risk);
  } catch (error) {
    console.error("Risk güncellenemedi:", error);
    return NextResponse.json({ error: "Risk güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.risk.delete({ where: { id } });
    return NextResponse.json({ message: "Risk silindi" });
  } catch (error) {
    console.error("Risk silinemedi:", error);
    return NextResponse.json({ error: "Risk silinemedi" }, { status: 500 });
  }
}
