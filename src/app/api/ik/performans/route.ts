import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId") || "";
    const where: Record<string, unknown> = {};
    if (employeeId) where.employeeId = employeeId;

    const reviews = await prisma.performanceReview.findMany({
      where,
      include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNo: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const review = await prisma.performanceReview.create({
      data: {
        employeeId: body.employeeId,
        period: body.period,
        reviewerId: body.reviewerId || null,
        score: body.score ? parseFloat(body.score) : null,
        notes: body.notes || null,
        status: body.status || "DRAFT",
        reviewDate: body.reviewDate ? new Date(body.reviewDate) : null,
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
    });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
