import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST - Toplu eğitim ataması
 * Body: {
 *   employeeIds: string[]
 *   trainingId: string
 *   trainingDate: string
 *   expiryDate?: string
 *   status?: string
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeIds, trainingId, trainingDate, expiryDate, status, notes } = body;

    if (!employeeIds?.length || !trainingId || !trainingDate) {
      return NextResponse.json(
        { error: "employeeIds, trainingId ve trainingDate zorunludur" },
        { status: 400 }
      );
    }

    // Zaten aynı eğitimi almış olanları bul
    const existing = await prisma.employeeTraining.findMany({
      where: {
        trainingId,
        employeeId: { in: employeeIds },
        status: { in: ["PLANNED", "COMPLETED_TRAINING"] },
      },
      select: { employeeId: true },
    });
    const existingSet = new Set(existing.map((e) => e.employeeId));

    const toCreate = employeeIds.filter((id: string) => !existingSet.has(id));
    const skipped = employeeIds.length - toCreate.length;

    if (toCreate.length > 0) {
      await prisma.employeeTraining.createMany({
        data: toCreate.map((employeeId: string) => ({
          employeeId,
          trainingId,
          trainingDate: new Date(trainingDate),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          status: status || "PLANNED",
          notes: notes || null,
        })),
      });
    }

    return NextResponse.json({
      created: toCreate.length,
      skipped,
      total: employeeIds.length,
    });
  } catch (error) {
    console.error("POST toplu eğitim error:", error);
    return NextResponse.json({ error: "Toplu atama başarısız" }, { status: 500 });
  }
}
