import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/* eslint-disable @typescript-eslint/no-explicit-any */

const ALLOWED_ROLES = ["SUPER_ADMIN", "ADMIN", "MUHASEBE"];

async function checkAccess() {
  const session = await auth();
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return null;
  }
  return session;
}

// GET: Çalışanlar + aktif maaş kaydı (veya tek çalışanın maaş geçmişi)
export async function GET(req: NextRequest) {
  const session = await checkAccess();
  if (!session) {
    return NextResponse.json({ error: "Bu sayfaya erişim yetkiniz yok" }, { status: 403 });
  }

  const workerId = req.nextUrl.searchParams.get("workerId");

  try {
    // Tek çalışanın maaş geçmişi
    if (workerId) {
      const salaries = await prisma.workerSalary.findMany({
        where: { workerId },
        orderBy: { effectiveFrom: "desc" },
      });
      return NextResponse.json(salaries);
    }

    // Tüm çalışanlar + aktif maaş kaydı
    const workers = await prisma.worker.findMany({
      where: { isActive: true },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        dailyRate: true,
        overtimeRate: true,
        team: {
          select: {
            id: true,
            name: true,
            company: { select: { id: true, name: true, type: true } },
          },
        },
        salaries: {
          where: { effectiveTo: null },
          orderBy: { effectiveFrom: "desc" },
          take: 1,
        },
      },
      orderBy: [
        { team: { company: { sortOrder: "asc" } } },
        { team: { sortOrder: "asc" } },
        { lastName: "asc" },
        { firstName: "asc" },
      ],
    });

    return NextResponse.json(workers);
  } catch (error) {
    console.error("Ücretler alınamadı:", error);
    return NextResponse.json({ error: "Ücretler alınamadı" }, { status: 500 });
  }
}

// POST: Yeni maaş kaydı ekle (eski aktif kayıt kapatılır, yeni açılır)
export async function POST(req: NextRequest) {
  const session = await checkAccess();
  if (!session) {
    return NextResponse.json({ error: "Bu sayfaya erişim yetkiniz yok" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { workerId, salaryType, amount, overtimeRate, effectiveFrom, note } = body;

    if (!workerId || !salaryType || amount === undefined || amount === null || !effectiveFrom) {
      return NextResponse.json({ error: "workerId, salaryType, amount ve effectiveFrom zorunlu" }, { status: 400 });
    }

    const parsedAmount = Number(amount);
    const parsedOvertimeRate = Number(overtimeRate) || 0;
    const fromDate = new Date(effectiveFrom + "T00:00:00Z");

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ error: "Geçersiz tutar" }, { status: 400 });
    }

    // Mevcut aktif kaydı bul
    const activeRecord = await prisma.workerSalary.findFirst({
      where: { workerId, effectiveTo: null },
      orderBy: { effectiveFrom: "desc" },
    });

    // Yeni kayıt mevcut kaydın başlangıcından önce olamaz
    if (activeRecord && fromDate <= activeRecord.effectiveFrom) {
      return NextResponse.json(
        { error: "Yeni maaş başlangıcı mevcut kaydın başlangıcından sonra olmalıdır" },
        { status: 400 }
      );
    }

    // Transaction: eski kaydı kapat + yeni kayıt + Worker cache güncelle
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Eski aktif kaydı kapat
      if (activeRecord) {
        const closingDate = new Date(fromDate);
        closingDate.setDate(closingDate.getDate() - 1);
        await tx.workerSalary.update({
          where: { id: activeRecord.id },
          data: { effectiveTo: closingDate },
        });
      }

      // 2. Yeni maaş kaydı oluştur
      const newSalary = await tx.workerSalary.create({
        data: {
          workerId,
          salaryType,
          amount: parsedAmount,
          overtimeRate: parsedOvertimeRate,
          effectiveFrom: fromDate,
          effectiveTo: null,
          note: note || null,
        },
      });

      // 3. Worker tablosundaki cache güncelle
      const dailyRate = salaryType === "MONTHLY" ? parsedAmount / 30 : parsedAmount;
      await tx.worker.update({
        where: { id: workerId },
        data: {
          dailyRate: Math.round(dailyRate * 100) / 100,
          overtimeRate: parsedOvertimeRate,
        },
      });

      return newSalary;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Maaş kaydı oluşturulamadı:", error);
    return NextResponse.json({ error: "Maaş kaydı oluşturulamadı" }, { status: 500 });
  }
}

// PUT: Aktif maaş kaydını güncelle (not veya oranlar)
export async function PUT(req: NextRequest) {
  const session = await checkAccess();
  if (!session) {
    return NextResponse.json({ error: "Bu sayfaya erişim yetkiniz yok" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id parametresi gerekli" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const { note } = body;

    const salary = await prisma.workerSalary.update({
      where: { id },
      data: { note: note ?? undefined },
    });

    return NextResponse.json(salary);
  } catch (error) {
    console.error("Maaş kaydı güncellenemedi:", error);
    return NextResponse.json({ error: "Maaş kaydı güncellenemedi" }, { status: 500 });
  }
}

// DELETE: Son aktif maaş kaydını sil, öncekini yeniden aç
export async function DELETE(req: NextRequest) {
  const session = await checkAccess();
  if (!session) {
    return NextResponse.json({ error: "Bu sayfaya erişim yetkiniz yok" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id parametresi gerekli" }, { status: 400 });
  }

  try {
    const salary = await prisma.workerSalary.findUnique({ where: { id } });
    if (!salary) {
      return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    }

    if (salary.effectiveTo !== null) {
      return NextResponse.json({ error: "Sadece aktif maaş kaydı silinebilir" }, { status: 400 });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.workerSalary.delete({ where: { id } });

      // Bir önceki kaydı yeniden aç
      const previousRecord = await tx.workerSalary.findFirst({
        where: { workerId: salary.workerId },
        orderBy: { effectiveFrom: "desc" },
      });

      if (previousRecord) {
        await tx.workerSalary.update({
          where: { id: previousRecord.id },
          data: { effectiveTo: null },
        });
        const dailyRate = previousRecord.salaryType === "MONTHLY"
          ? previousRecord.amount / 30
          : previousRecord.amount;
        await tx.worker.update({
          where: { id: salary.workerId },
          data: {
            dailyRate: Math.round(dailyRate * 100) / 100,
            overtimeRate: previousRecord.overtimeRate,
          },
        });
      } else {
        await tx.worker.update({
          where: { id: salary.workerId },
          data: { dailyRate: null, overtimeRate: null },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Maaş kaydı silinemedi:", error);
    return NextResponse.json({ error: "Maaş kaydı silinemedi" }, { status: 500 });
  }
}
