import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tek çalışan detay
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        company: true,
        department: true,
        position: true,
        project: true,
        team: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        contracts: { orderBy: { createdAt: "desc" } },
        documents: { orderBy: { createdAt: "desc" } },
        leaveRequests: { orderBy: { createdAt: "desc" }, take: 10 },
        leaveBalances: { orderBy: { year: "desc" } },
        disciplineRecords: { orderBy: { date: "desc" } },
        performanceReviews: { orderBy: { createdAt: "desc" } },
        positionHistory: { orderBy: { effectiveDate: "desc" } },
        trainings: { include: { training: true }, orderBy: { createdAt: "desc" } },
        certificates: { orderBy: { createdAt: "desc" } },
        medicalExams: { orderBy: { examDate: "desc" } },
        ppeAssignments: { include: { ppeType: true }, orderBy: { createdAt: "desc" } },
      },
    });

    if (!employee) {
      return NextResponse.json({ error: "Çalışan bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(employee);
  } catch (error) {
    console.error("GET /api/ik/personel/[id] error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

// PUT - Çalışan güncelle
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    const employee = await prisma.employee.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        tcNo: body.tcNo || null,
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        birthPlace: body.birthPlace || null,
        gender: body.gender || null,
        maritalStatus: body.maritalStatus || null,
        bloodType: body.bloodType || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        emergencyName: body.emergencyName || null,
        emergencyPhone: body.emergencyPhone || null,
        emergencyRelation: body.emergencyRelation || null,
        companyId: body.companyId || null,
        departmentId: body.departmentId || null,
        positionId: body.positionId || null,
        projectId: body.projectId || null,
        teamId: body.teamId || null,
        managerId: body.managerId || null,
        employeeNo: body.employeeNo || null,
        hireDate: body.hireDate ? new Date(body.hireDate) : null,
        sgkStartDate: body.sgkStartDate ? new Date(body.sgkStartDate) : null,
        sgkNo: body.sgkNo || null,
        salary: body.salary ? parseFloat(body.salary) : null,
        salaryType: body.salaryType || null,
        status: body.status || undefined,
        exitDate: body.exitDate ? new Date(body.exitDate) : null,
        exitReason: body.exitReason || null,
      },
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(employee);
  } catch (error) {
    console.error("PUT /api/ik/personel/[id] error:", error);
    return NextResponse.json({ error: "Güncelleme başarısız" }, { status: 500 });
  }
}

// DELETE - Çalışan sil
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await prisma.employee.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/ik/personel/[id] error:", error);
    return NextResponse.json({ error: "Silme başarısız" }, { status: 500 });
  }
}
