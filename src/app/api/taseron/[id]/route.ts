import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - Tek taşeron firma detayı
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        teams: {
          include: { _count: { select: { workers: true } } },
          orderBy: { name: "asc" },
        },
        hakedisContracts: {
          where: { type: "TASERON" },
          include: {
            project: { select: { id: true, name: true } },
            _count: { select: { hakedisler: true, atasmanlar: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        hakedisler: {
          where: { type: "TASERON" },
          include: {
            contract: { select: { id: true, name: true, currency: true } },
            project: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        taseronPerformanslar: {
          include: {
            evaluatedBy: { select: { id: true, name: true } },
            contract: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        taseronKesintiler: {
          include: {
            contract: { select: { id: true, name: true } },
            hakedis: { select: { id: true, no: true, period: true } },
          },
          orderBy: { date: "desc" },
        },
        taseronTeminatlar: {
          include: {
            contract: { select: { id: true, name: true } },
          },
          orderBy: { startDate: "desc" },
        },
        taseronEvraklar: {
          orderBy: [{ expiryDate: "asc" }, { createdAt: "desc" }],
        },
        taseronPuantajlar: {
          include: {
            kalemler: true,
            contract: { select: { id: true, name: true } },
            createdBy: { select: { id: true, name: true } },
          },
          orderBy: { date: "desc" },
          take: 30,
        },
        employees: {
          select: { id: true, firstName: true, lastName: true, status: true },
          orderBy: { firstName: "asc" },
        },
        _count: {
          select: {
            teams: true,
            hakedisContracts: true,
            hakedisler: true,
            employees: true,
            taseronPerformanslar: true,
            taseronKesintiler: true,
            taseronTeminatlar: true,
            taseronEvraklar: true,
            taseronPuantajlar: true,
          } as any,
        },
      } as any,
    }) as any;

    if (!company) {
      return NextResponse.json(
        { error: "Taşeron firma bulunamadı" },
        { status: 404 }
      );
    }

    // Özet hesaplamalar
    const toplamSozlesmeTutar = company.hakedisContracts.reduce(
      (s: number, c: any) => s + c.totalAmount,
      0
    );
    const toplamHakedis = company.hakedisler.reduce(
      (s: number, h: any) => s + h.totalAmount,
      0
    );
    const toplamOdenen = company.hakedisler
      .filter((h: any) => h.status === "PAID")
      .reduce((s: number, h: any) => s + h.netAmount, 0);
    const toplamKesinti = company.taseronKesintiler
      .filter((k: any) => k.status === "UYGULANDI")
      .reduce((s: number, k: any) => s + k.amount, 0);
    const aktifTeminatTutar = company.taseronTeminatlar
      .filter((t: any) => t.status === "AKTIF")
      .reduce((s: number, t: any) => s + t.amount, 0);

    // Süresi yaklaşan / dolmuş evraklar
    const now = new Date();
    const suresiDolmusEvrak = company.taseronEvraklar.filter(
      (e: any) => e.expiryDate && e.expiryDate < now
    ).length;
    const suresiYaklasanEvrak = company.taseronEvraklar.filter(
      (e: any) =>
        e.expiryDate &&
        e.expiryDate >= now &&
        e.expiryDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    ).length;

    return NextResponse.json({
      ...company,
      ozet: {
        toplamSozlesmeTutar,
        toplamHakedis,
        toplamOdenen,
        kalanBorc: toplamHakedis - toplamOdenen,
        toplamKesinti,
        aktifTeminatTutar,
        suresiDolmusEvrak,
        suresiYaklasanEvrak,
      },
    });
  } catch (error) {
    console.error("Taşeron detay hatası:", error);
    return NextResponse.json(
      { error: "Taşeron bilgileri yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - Taşeron firma güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      phone,
      email,
      website,
      address,
      city,
      district,
      taxOffice,
      taxNo,
      contactPerson,
      contactPhone,
      specialization,
      notes,
      isActive,
    } = body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone?.trim() || null }),
        ...(email !== undefined && { email: email?.trim() || null }),
        ...(website !== undefined && { website: website?.trim() || null }),
        ...(address !== undefined && { address: address?.trim() || null }),
        ...(city !== undefined && { city: city?.trim() || null }),
        ...(district !== undefined && { district: district?.trim() || null }),
        ...(taxOffice !== undefined && { taxOffice: taxOffice?.trim() || null }),
        ...(taxNo !== undefined && { taxNo: taxNo?.trim() || null }),
        ...(contactPerson !== undefined && { contactPerson: contactPerson?.trim() || null }),
        ...(contactPhone !== undefined && { contactPhone: contactPhone?.trim() || null }),
        ...(specialization !== undefined && { specialization: specialization?.trim() || null }),
        ...(notes !== undefined && { notes: notes?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      } as any,
    });

    return NextResponse.json(company);
  } catch (error) {
    console.error("Taşeron güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Taşeron firma güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE - Taşeron firma sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Önce bağlı sözleşme var mı kontrol et
    const contractCount = await prisma.hakedisContract.count({
      where: { companyId: id, type: "TASERON" },
    });

    if (contractCount > 0) {
      return NextResponse.json(
        {
          error: `Bu firmaya ait ${contractCount} aktif sözleşme bulunuyor. Önce sözleşmeleri silin veya başka firmaya aktarın.`,
        },
        { status: 400 }
      );
    }

    await prisma.company.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Taşeron silme hatası:", error);
    return NextResponse.json(
      { error: "Taşeron firma silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
