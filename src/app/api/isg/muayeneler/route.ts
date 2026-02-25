import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "";
    const result = searchParams.get("result") || "";
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;
    if (result) where.result = result;

    const exams = await prisma.medicalExam.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true, department: { select: { name: true } } } },
      },
      orderBy: { examDate: "desc" },
    });
    return NextResponse.json(exams);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exam = await prisma.medicalExam.create({
      data: {
        employeeId: body.employeeId,
        type: body.type,
        examDate: new Date(body.examDate),
        nextExamDate: body.nextExamDate ? new Date(body.nextExamDate) : null,
        result: body.result || "PENDING_EXAM",
        hospital: body.hospital || null,
        doctorName: body.doctorName || null,
        notes: body.notes || null,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
    return NextResponse.json(exam, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
