import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const today = new Date();

    const [
      totalTrainings,
      completedTrainings,
      expiredTrainings,
      plannedTrainings,
      totalCertificates,
      validCertificates,
      expiredCertificates,
      totalExams,
      pendingExams,
      totalPPE,
      assignedPPE,
      totalAccidents,
      openAccidents,
    ] = await Promise.all([
      prisma.employeeTraining.count(),
      prisma.employeeTraining.count({ where: { status: "COMPLETED_TRAINING" } }),
      prisma.employeeTraining.count({ where: { status: "EXPIRED_TRAINING" } }),
      prisma.employeeTraining.count({ where: { status: "PLANNED" } }),
      prisma.certificate.count(),
      prisma.certificate.count({ where: { status: "VALID" } }),
      prisma.certificate.count({ where: { status: "EXPIRED_CERT" } }),
      prisma.medicalExam.count(),
      prisma.medicalExam.count({ where: { result: "PENDING_EXAM" } }),
      prisma.pPEAssignment.count(),
      prisma.pPEAssignment.count({ where: { status: "ASSIGNED" } }),
      prisma.workAccident.count(),
      prisma.workAccident.count({ where: { status: "OPEN_ACCIDENT" } }),
    ]);

    // Yaklaşan muayeneler (30 gün içinde)
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const upcomingExams = await prisma.medicalExam.findMany({
      where: {
        nextExamDate: { gte: today, lte: thirtyDaysLater },
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { nextExamDate: "asc" },
      take: 10,
    });

    // Yaklaşan sertifika bitişleri
    const upcomingCertExpiry = await prisma.certificate.findMany({
      where: {
        expiryDate: { gte: today, lte: thirtyDaysLater },
        status: "VALID",
      },
      include: { employee: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { expiryDate: "asc" },
      take: 10,
    });

    // Son kazalar
    const recentAccidents = await prisma.workAccident.findMany({
      include: {
        project: { select: { name: true } },
        involvedEmployees: { include: { employee: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { date: "desc" },
      take: 5,
    });

    return NextResponse.json({
      trainings: { total: totalTrainings, completed: completedTrainings, expired: expiredTrainings, planned: plannedTrainings },
      certificates: { total: totalCertificates, valid: validCertificates, expired: expiredCertificates },
      exams: { total: totalExams, pending: pendingExams },
      ppe: { total: totalPPE, assigned: assignedPPE },
      accidents: { total: totalAccidents, open: openAccidents },
      upcomingExams,
      upcomingCertExpiry,
      recentAccidents,
    });
  } catch (error) {
    console.error("GET /api/isg/istatistikler error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
