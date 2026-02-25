import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const definitions = await prisma.trainingDefinition.findMany({
      include: { _count: { select: { trainings: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(definitions);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const def = await prisma.trainingDefinition.create({
      data: {
        name: body.name,
        description: body.description || null,
        durationHours: body.durationHours ? parseFloat(body.durationHours) : 0,
        isMandatory: body.isMandatory || false,
        validityMonths: body.validityMonths ? parseInt(body.validityMonths) : null,
        category: body.category || "ISG",
      },
    });
    return NextResponse.json(def, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
