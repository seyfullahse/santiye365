import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type EmployeeInfo = {
  id: string;
  firstName: string;
  lastName: string;
  collarType: string | null;
  departmentId: string | null;
  positionId: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
};

type TrainingRecord = {
  id: string;
  trainingId: string;
  trainingDate: Date;
  expiryDate: Date | null;
  status: string;
  training: { id: string; name: string; category: string; isMandatory: boolean };
};

type PPEItem = {
  id: string;
  assignDate: Date;
  expiryDate: Date | null;
  ppeType: { name: string; category: string | null };
};

type TrainingDefWithReqs = {
  id: string;
  name: string;
  category: string;
  isMandatory: boolean;
  requirements: { targetType: string; targetValue: string | null }[];
};

/**
 * GET /api/isg/benim
 * Giriş yapan kullanıcının ISG özet bilgilerini döner
 * - Aldığı eğitimler, eksik zorunlu eğitimler
 * - KKD zimmetleri
 * - Uyum skoru
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    // User → Employee bağlantısını bul
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });

    if (!user?.employeeId) {
      return NextResponse.json({ linked: false, message: "Kullanıcıya bağlı çalışan kaydı bulunamadı" });
    }

    const employeeId = user.employeeId;

    // Paralel sorgular
    const [employee, trainings, ppeAssignments, trainingDefsWithReqs]: [
      EmployeeInfo | null, TrainingRecord[], PPEItem[], TrainingDefWithReqs[]
    ] = await Promise.all([
      // Çalışan bilgisi
      prisma.employee.findUnique({
        where: { id: employeeId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          collarType: true,
          departmentId: true,
          positionId: true,
          department: { select: { name: true } },
          position: { select: { name: true } },
        },
      }),
      // Eğitim kayıtları
      prisma.employeeTraining.findMany({
        where: { employeeId },
        select: {
          id: true,
          trainingId: true,
          trainingDate: true,
          expiryDate: true,
          status: true,
          training: { select: { id: true, name: true, category: true, isMandatory: true } },
        },
        orderBy: { trainingDate: "desc" },
      }),
      // KKD zimmetleri
      prisma.pPEAssignment.findMany({
        where: { employeeId, status: "ASSIGNED" },
        select: {
          id: true,
          assignDate: true,
          expiryDate: true,
          ppeType: { select: { name: true, category: true } },
        },
        orderBy: { assignDate: "desc" },
      }),
      // Eğitim tanımları + requirements (zorunlu olanlar)
      prisma.trainingDefinition.findMany({
        where: {
          OR: [
            { isMandatory: true },
            { requirements: { some: {} } },
          ],
        },
        select: {
          id: true,
          name: true,
          category: true,
          isMandatory: true,
          requirements: {
            select: { targetType: true, targetValue: true },
          },
        },
      }),
    ]);

    if (!employee) {
      return NextResponse.json({ linked: false, message: "Çalışan kaydı bulunamadı" });
    }

    const now = new Date();

    // Bu çalışan için zorunlu eğitimleri hesapla
    const mandatoryForMe = trainingDefsWithReqs.filter((td) => {
      if (td.requirements.length > 0) {
        return td.requirements.some((req) => {
          switch (req.targetType) {
            case "ALL": return true;
            case "COLLAR_TYPE": return employee.collarType === req.targetValue;
            case "DEPARTMENT": return employee.departmentId === req.targetValue;
            case "POSITION": return employee.positionId === req.targetValue;
            case "EMPLOYEE": return employee.id === req.targetValue;
            default: return false;
          }
        });
      }
      return td.isMandatory;
    });

    // Eğitim durumları
    const completed = trainings.filter((t) => t.status === "COMPLETED_TRAINING");
    const planned = trainings.filter((t) => t.status === "PLANNED");
    const expired = trainings.filter(
      (t) => t.status === "EXPIRED_TRAINING" || (t.expiryDate && new Date(t.expiryDate) < now && t.status === "COMPLETED_TRAINING")
    );

    // Eksik zorunlu eğitimler
    const completedIds = new Set(
      trainings.filter((t) => t.status === "COMPLETED_TRAINING" || t.status === "PLANNED").map((t) => t.trainingId)
    );
    const missingMandatory = mandatoryForMe.filter((mt) => !completedIds.has(mt.id));

    // Uyum skoru
    const mandatoryTotal = mandatoryForMe.length;
    const mandatoryCompleted = mandatoryTotal - missingMandatory.length;
    const complianceScore = mandatoryTotal > 0 ? Math.round((mandatoryCompleted / mandatoryTotal) * 100) : 100;

    // KKD durumu
    const expiredPPE = ppeAssignments.filter((p) => p.expiryDate && new Date(p.expiryDate) < now);

    // Yaklaşan süreler (30 gün içinde dolacaklar)
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const expiringTrainings = completed.filter(
      (t) => t.expiryDate && new Date(t.expiryDate) > now && new Date(t.expiryDate) <= thirtyDaysLater
    );
    const expiringPPE = ppeAssignments.filter(
      (p) => p.expiryDate && new Date(p.expiryDate) > now && new Date(p.expiryDate) <= thirtyDaysLater
    );

    return NextResponse.json({
      linked: true,
      employee: {
        firstName: employee.firstName,
        lastName: employee.lastName,
        collarType: employee.collarType,
        department: employee.department?.name || null,
        position: employee.position?.name || null,
      },
      complianceScore,
      trainings: {
        completedCount: completed.length,
        plannedCount: planned.length,
        expiredCount: expired.length,
        missingMandatoryCount: missingMandatory.length,
        mandatoryTotal,
        missingMandatory: missingMandatory.map((m) => ({ id: m.id, name: m.name, category: m.category })),
        expiring: expiringTrainings.map((t) => ({
          name: t.training.name,
          expiryDate: t.expiryDate,
        })),
      },
      ppe: {
        activeCount: ppeAssignments.length,
        expiredCount: expiredPPE.length,
        expiringCount: expiringPPE.length,
        items: ppeAssignments.slice(0, 5).map((p) => ({
          name: p.ppeType.name,
          category: p.ppeType.category,
          expiryDate: p.expiryDate,
          isExpired: p.expiryDate ? new Date(p.expiryDate) < now : false,
        })),
      },
    });
  } catch (error) {
    console.error("GET /api/isg/benim error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
