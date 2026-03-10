import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Çalışan listesi
export async function GET(req: NextRequest) {
  try {
    const companyType = req.nextUrl.searchParams.get("companyType");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = { isActive: true };
    if (companyType && companyType !== "all") {
      whereClause.team = { company: { type: companyType } };
    }

    const workers = await prisma.worker.findMany({
      where: whereClause,
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, type: true } },
          },
        },
      },
      orderBy: [
        { team: { company: { name: "asc" } } },
        { team: { name: "asc" } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    return NextResponse.json(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      workers.map((w: any) => ({
        id: w.id,
        firstName: w.firstName,
        lastName: w.lastName,
        role: w.role,
        identityNo: w.identityNo,
        phone: w.phone,
        position: w.position,
        bloodType: w.bloodType,
        emergencyContact: w.emergencyContact,
        emergencyPhone: w.emergencyPhone,
        isActive: w.isActive,
        startDate: w.startDate ? w.startDate.toISOString().slice(0, 10) : null,
        endDate: w.endDate ? w.endDate.toISOString().slice(0, 10) : null,
        sortOrder: w.sortOrder,
        team: w.team,
        createdAt: w.createdAt,
      }))
    );
  } catch (error) {
    console.error("Çalışanlar alınamadı:", error);
    return NextResponse.json({ error: "Çalışanlar alınamadı" }, { status: 500 });
  }
}

// POST: Yeni çalışan oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      role,
      teamId,
      identityNo,
      phone,
      position,
      bloodType,
      emergencyContact,
      emergencyPhone,
      isActive,
      startDate,
      endDate,
    } = body;

    if (!firstName || !lastName || !role || !teamId) {
      return NextResponse.json(
        { error: "Ad, soyad, görev ve ekip zorunludur" },
        { status: 400 }
      );
    }

    const worker = await prisma.worker.create({
      data: {
        firstName,
        lastName,
        role,
        teamId,
        identityNo: identityNo || null,
        phone: phone || null,
        position: position || null,
        bloodType: bloodType || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        isActive: isActive ?? true,
        startDate: startDate ? new Date(startDate + "T00:00:00.000Z") : null,
        endDate: endDate ? new Date(endDate + "T00:00:00.000Z") : null,
      },
      include: {
        team: {
          include: { company: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error("Çalışan oluşturulamadı:", error);
    return NextResponse.json({ error: "Çalışan oluşturulamadı" }, { status: 500 });
  }
}

// PUT: Çalışan güncelle
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id parametresi gerekli" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      role,
      teamId,
      identityNo,
      phone,
      position,
      bloodType,
      emergencyContact,
      emergencyPhone,
      isActive,
      startDate,
      endDate,
    } = body;

    const worker = await prisma.worker.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(role !== undefined && { role }),
        ...(teamId !== undefined && { teamId }),
        identityNo: identityNo || null,
        phone: phone || null,
        position: position || null,
        bloodType: bloodType || null,
        emergencyContact: emergencyContact || null,
        emergencyPhone: emergencyPhone || null,
        ...(isActive !== undefined && { isActive }),
        startDate: startDate ? new Date(startDate + "T00:00:00.000Z") : null,
        endDate: endDate ? new Date(endDate + "T00:00:00.000Z") : null,
      },
      include: {
        team: {
          include: { company: { select: { id: true, name: true } } },
        },
      },
    });

    return NextResponse.json(worker);
  } catch (error) {
    console.error("Çalışan güncellenemedi:", error);
    return NextResponse.json({ error: "Çalışan güncellenemedi" }, { status: 500 });
  }
}

// DELETE: Çalışan sil
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id parametresi gerekli" }, { status: 400 });
  }

  try {
    await prisma.worker.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("Çalışan silinemedi:", error);
    return NextResponse.json({ error: "Çalışan silinemedi" }, { status: 500 });
  }
}
