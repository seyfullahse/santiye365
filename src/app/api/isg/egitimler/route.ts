import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "";
    const status = searchParams.get("status") || "";

    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (status) where.status = status;

    const trainings = await prisma.employeeTraining.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, department: { select: { name: true } } } },
        training: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(trainings);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const training = await prisma.employeeTraining.create({
      data: {
        employeeId: body.employeeId,
        trainingId: body.trainingId,
        trainingDate: new Date(body.trainingDate),
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        status: body.status || "PLANNED",
        score: body.score ? parseFloat(body.score) : null,
        notes: body.notes || null,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        training: true,
      },
    });
    return NextResponse.json(training, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
