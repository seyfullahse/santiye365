import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tüm çalışanları listele (sayfalama + arama + filtreleme)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const departmentId = searchParams.get("departmentId") || "";
    const companyId = searchParams.get("companyId") || "";
    const projectId = searchParams.get("projectId") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { tcNo: { contains: search } },
        { employeeNo: { contains: search } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && status !== "all") where.status = status;
    if (departmentId && departmentId !== "all") where.departmentId = departmentId;
    if (companyId && companyId !== "all") where.companyId = companyId;
    if (projectId && projectId !== "all") where.projectId = projectId;

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        include: {
          company: { select: { id: true, name: true } },
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
        },
        orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.employee.count({ where }),
    ]);

    return NextResponse.json({ employees, total, page, limit });
  } catch (error) {
    console.error("GET /api/ik/personel error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

// POST - Yeni çalışan oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const employee = await prisma.employee.create({
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
        collarType: body.collarType || null,
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
        status: body.status || "ACTIVE",
      },
      include: {
        company: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        position: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        team: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch (error) {
    console.error("POST /api/ik/personel error:", error);
    return NextResponse.json({ error: "Kayıt oluşturulamadı" }, { status: 500 });
  }
}
