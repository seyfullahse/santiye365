import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type EmployeeWithInfo = {
  id: string;
  firstName: string;
  lastName: string;
  employeeNo: string | null;
  collarType: string | null;
  departmentId: string | null;
  positionId: string | null;
  department: { id: string; name: string } | null;
  position: { id: string; name: string } | null;
};

type TrainingDefWithReqs = {
  id: string;
  name: string;
  category: string;
  validityMonths: number | null;
  isMandatory: boolean;
  requirements: { targetType: string; targetValue: string | null }[];
};

type TrainingRecord = {
  id: string;
  employeeId: string;
  trainingId: string;
  trainingDate: Date;
  expiryDate: Date | null;
  status: string;
  score: number | null;
  training: { id: string; name: string; category: string; isMandatory: boolean };
};

type PPERecord = {
  id: string;
  employeeId: string;
  ppeTypeId: string;
  assignDate: Date;
  expiryDate: Date | null;
  status: string;
  ppeType: { name: string; category: string | null };
};

/**
 * GET - Tüm personelin İSG uyum durumunu döner
 * Her personel için: eğitimler, KKD zimmetleri, zorunlu eksik eğitimler
 * Zorunlu eğitimler TrainingRequirement tablosuna göre kişiye özel hesaplanır
 */
export async function GET() {
  try {
    // Paralel sorgular
    const [employees, trainingDefsWithReqs, allTrainingRecords, allPPEAssignments]: [
      EmployeeWithInfo[], TrainingDefWithReqs[], TrainingRecord[], PPERecord[]
    ] = await Promise.all([
      // Tüm personel (departman, pozisyon, collarType dahil)
      prisma.employee.findMany({
        where: { status: "ACTIVE" },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          collarType: true,
          departmentId: true,
          positionId: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
      }),
      // Eğitim tanımları + requirements
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
          validityMonths: true,
          isMandatory: true,
          requirements: {
            select: { targetType: true, targetValue: true },
          },
        },
      }),
      // Tüm eğitim kayıtları
      prisma.employeeTraining.findMany({
        select: {
          id: true,
          employeeId: true,
          trainingId: true,
          trainingDate: true,
          expiryDate: true,
          status: true,
          score: true,
          training: { select: { id: true, name: true, category: true, isMandatory: true } },
        },
      }),
      // Tüm KKD zimmetleri
      prisma.pPEAssignment.findMany({
        where: { status: "ASSIGNED" },
        select: {
          id: true,
          employeeId: true,
          ppeTypeId: true,
          assignDate: true,
          expiryDate: true,
          status: true,
          ppeType: { select: { name: true, category: true } },
        },
      }),
    ]);

    // Kişiye özel zorunlu eğitimleri hesapla
    function getMandatoryTrainingsForEmployee(emp: typeof employees[0]) {
      return trainingDefsWithReqs.filter((td) => {
        // Yeni requirement sistemi varsa ona bak
        if (td.requirements.length > 0) {
          return td.requirements.some((req) => {
            switch (req.targetType) {
              case "ALL":
                return true;
              case "COLLAR_TYPE":
                return emp.collarType === req.targetValue;
              case "DEPARTMENT":
                return emp.departmentId === req.targetValue;
              case "POSITION":
                return emp.positionId === req.targetValue;
              case "EMPLOYEE":
                return emp.id === req.targetValue;
              default:
                return false;
            }
          });
        }
        // Eski isMandatory sistemi (geriye uyumluluk)
        return td.isMandatory;
      });
    }

    // Eğitim kayıtlarını employee bazında grupla
    const trainingsByEmployee = new Map<string, typeof allTrainingRecords>();
    for (const t of allTrainingRecords) {
      const list = trainingsByEmployee.get(t.employeeId) || [];
      list.push(t);
      trainingsByEmployee.set(t.employeeId, list);
    }

    // KKD zimmetlerini employee bazında grupla
    const ppeByEmployee = new Map<string, typeof allPPEAssignments>();
    for (const p of allPPEAssignments) {
      const list = ppeByEmployee.get(p.employeeId) || [];
      list.push(p);
      ppeByEmployee.set(p.employeeId, list);
    }

    const now = new Date();

    // Her personel için İSG durumunu hesapla
    const result = employees.map((emp) => {
      const empTrainings = trainingsByEmployee.get(emp.id) || [];
      const empPPE = ppeByEmployee.get(emp.id) || [];

      // Eğitim durumları
      const completedTrainings = empTrainings.filter((t) => t.status === "COMPLETED_TRAINING");
      const plannedTrainings = empTrainings.filter((t) => t.status === "PLANNED");
      const expiredTrainings = empTrainings.filter(
        (t) => t.status === "EXPIRED_TRAINING" || (t.expiryDate && new Date(t.expiryDate) < now && t.status === "COMPLETED_TRAINING")
      );

      // Kişiye özel zorunlu eğitimler
      const mandatoryForThisEmp = getMandatoryTrainingsForEmployee(emp);

      // Zorunlu eksik eğitimler
      const completedTrainingIds = new Set(
        empTrainings
          .filter((t) => t.status === "COMPLETED_TRAINING" || t.status === "PLANNED")
          .map((t) => t.trainingId)
      );
      const missingMandatory = mandatoryForThisEmp.filter((mt) => !completedTrainingIds.has(mt.id));

      // KKD durumu
      const expiredPPE = empPPE.filter((p) => p.expiryDate && new Date(p.expiryDate) < now);

      // Uyum skoru hesapla (kişiye özel zorunlu eğitim yüzdesi)
      const mandatoryTotal = mandatoryForThisEmp.length;
      const mandatoryCompleted = mandatoryTotal - missingMandatory.length;
      const complianceScore = mandatoryTotal > 0 ? Math.round((mandatoryCompleted / mandatoryTotal) * 100) : 100;

      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        employeeNo: emp.employeeNo,
        collarType: emp.collarType || null,
        department: emp.department?.name || null,
        position: emp.position?.name || null,
        mandatoryCount: mandatoryForThisEmp.length,
        trainings: {
          completed: completedTrainings.map((t) => ({
            id: t.id,
            name: t.training.name,
            category: t.training.category,
            status: t.status,
            date: t.trainingDate,
            expiryDate: t.expiryDate,
            score: t.score,
            isMandatory: t.training.isMandatory,
          })),
          planned: plannedTrainings.map((t) => ({
            id: t.id,
            name: t.training.name,
            category: t.training.category,
            status: t.status,
            date: t.trainingDate,
            isMandatory: t.training.isMandatory,
          })),
          expired: expiredTrainings.map((t) => ({
            id: t.id,
            name: t.training.name,
            category: t.training.category,
            status: t.status,
            date: t.trainingDate,
            expiryDate: t.expiryDate,
            isMandatory: t.training.isMandatory,
          })),
          missingMandatory: missingMandatory.map((mt) => ({
            id: mt.id,
            name: mt.name,
            category: mt.category,
          })),
        },
        ppe: {
          active: empPPE.length,
          expired: expiredPPE.length,
          items: empPPE.map((p) => ({
            name: p.ppeType.name,
            category: p.ppeType.category,
            assignDate: p.assignDate,
            expiryDate: p.expiryDate,
            isExpired: p.expiryDate ? new Date(p.expiryDate) < now : false,
          })),
        },
        complianceScore,
      };
    });

    // Genel istatistikler
    const summary = {
      totalEmployees: employees.length,
      fullCompliance: result.filter((r) => r.complianceScore === 100).length,
      partialCompliance: result.filter((r) => r.complianceScore > 0 && r.complianceScore < 100).length,
      noCompliance: result.filter((r) => r.complianceScore === 0).length,
      mandatoryTrainingCount: trainingDefsWithReqs.length,
    };

    return NextResponse.json({ employees: result, summary });
  } catch (error) {
    console.error("GET error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}
