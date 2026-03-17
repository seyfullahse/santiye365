import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, type, startDate, endDate, reason } = body;

    if (!employeeId || !type || !startDate || !endDate) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    // Geçerli izin türleri (LeaveType enum)
    const validTypes = ["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "MARRIAGE", "BEREAVEMENT", "UNPAID", "COMPENSATION", "OTHER_LEAVE"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Geçersiz izin türü" }, { status: 400 });
    }

    // Employee'nin bu kullanıcıya ait olduğunu doğrula (güvenlik)
    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });

    if (!user?.employeeId || user.employeeId !== employeeId) {
      return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    }

    // Gün hesapla
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      return NextResponse.json({ error: "Bitiş tarihi başlangıçtan önce olamaz" }, { status: 400 });
    }
    const diffMs = end.getTime() - start.getTime();
    const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // Çakışma kontrolü (leaveRequest tablosunda)
    const overlap = await (prisma as any).leaveRequest.findFirst({
      where: {
        employeeId,
        status: { in: ["PENDING", "APPROVED"] },
        OR: [
          { startDate: { lte: end }, endDate: { gte: start } },
        ],
      },
    });

    if (overlap) {
      return NextResponse.json(
        { error: "Bu tarih aralığında zaten bir izin talebi mevcut" },
        { status: 409 }
      );
    }

    // İzin talebi oluştur (leaveRequest tablosuna)
    const leave = await (prisma as any).leaveRequest.create({
      data: {
        employeeId,
        type,
        startDate: start,
        endDate: end,
        totalDays,
        reason: reason || null,
        status: "PENDING",
      },
    });

    return NextResponse.json({
      leave: {
        id: leave.id,
        type: leave.type,
        startDate: leave.startDate.toISOString(),
        endDate: leave.endDate.toISOString(),
        totalDays: leave.totalDays,
        reason: leave.reason,
        status: leave.status,
        createdAt: leave.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("İzin talebi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

/* ─── PUT: Beklemedeki izin talebini düzenle ─── */
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
    }

    const body = await request.json();
    const { leaveId, type, startDate, endDate, reason } = body;

    if (!leaveId || !type || !startDate || !endDate) {
      return NextResponse.json({ error: "Zorunlu alanlar eksik" }, { status: 400 });
    }

    const validTypes = ["ANNUAL", "SICK", "MATERNITY", "PATERNITY", "MARRIAGE", "BEREAVEMENT", "UNPAID", "COMPENSATION", "OTHER_LEAVE"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Geçersiz izin türü" }, { status: 400 });
    }

    // Sahiplik doğrulama: User → Employee
    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });
    if (!user?.employeeId) {
      return NextResponse.json({ error: "İK kaydınız bulunamadı" }, { status: 400 });
    }

    // Talebi bul ve sahibi kontrol et
    const existing = await (prisma as any).leaveRequest.findUnique({ where: { id: leaveId } });
    if (!existing) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    if (existing.employeeId !== user.employeeId) return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    if (existing.status !== "PENDING") return NextResponse.json({ error: "Sadece beklemedeki talepler düzenlenebilir" }, { status: 400 });

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return NextResponse.json({ error: "Bitiş tarihi başlangıçtan önce olamaz" }, { status: 400 });
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Çakışma kontrolü (kendi talebi hariç)
    const overlap = await (prisma as any).leaveRequest.findFirst({
      where: {
        employeeId: user.employeeId,
        id: { not: leaveId },
        status: { in: ["PENDING", "APPROVED"] },
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
      },
    });
    if (overlap) return NextResponse.json({ error: "Bu tarih aralığında zaten bir izin talebi mevcut" }, { status: 409 });

    const leave = await (prisma as any).leaveRequest.update({
      where: { id: leaveId },
      data: { type, startDate: start, endDate: end, totalDays, reason: reason || null },
    });

    return NextResponse.json({
      leave: {
        id: leave.id, type: leave.type,
        startDate: leave.startDate.toISOString(), endDate: leave.endDate.toISOString(),
        totalDays: leave.totalDays, reason: leave.reason, status: leave.status,
        createdAt: leave.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("İzin düzenleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

/* ─── DELETE: Beklemedeki izin talebini sil ─── */
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkilendirme gerekli" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const leaveId = searchParams.get("id");
    if (!leaveId) return NextResponse.json({ error: "Talep ID gerekli" }, { status: 400 });

    // Sahiplik doğrulama
    const user = await (prisma as any).user.findUnique({
      where: { id: session.user.id },
      select: { employeeId: true },
    });
    if (!user?.employeeId) return NextResponse.json({ error: "İK kaydınız bulunamadı" }, { status: 400 });

    const existing = await (prisma as any).leaveRequest.findUnique({ where: { id: leaveId } });
    if (!existing) return NextResponse.json({ error: "Talep bulunamadı" }, { status: 404 });
    if (existing.employeeId !== user.employeeId) return NextResponse.json({ error: "Bu işlem için yetkiniz yok" }, { status: 403 });
    if (existing.status !== "PENDING") return NextResponse.json({ error: "Sadece beklemedeki talepler silinebilir" }, { status: 400 });

    await (prisma as any).leaveRequest.delete({ where: { id: leaveId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İzin silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
