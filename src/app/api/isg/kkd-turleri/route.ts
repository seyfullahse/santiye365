import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const types = await prisma.pPEType.findMany({
      include: { _count: { select: { assignments: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const type = await prisma.pPEType.create({
      data: {
        name: body.name,
        category: body.category || null,
        validityDays: body.validityDays ? parseInt(body.validityDays) : null,
      },
    });
    return NextResponse.json(type, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
