import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "";
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const documents = await prisma.employeeDocument.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const doc = await prisma.employeeDocument.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        name: body.name,
        fileUrl: body.fileUrl || null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
