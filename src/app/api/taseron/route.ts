import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/* eslint-disable @typescript-eslint/no-explicit-any */

// GET - Taşeron firma listesi + KPI verileri
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const isActive = searchParams.get("isActive");

    const where: any = {
      type: "SUBCONTRACTOR",
    };

    if (isActive !== null && isActive !== "all") {
      where.isActive = isActive === "true";
    }

    if (search?.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: "insensitive" } },
        { specialization: { contains: search.trim(), mode: "insensitive" } },
        { contactPerson: { contains: search.trim(), mode: "insensitive" } },
        { taxNo: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const companies = await prisma.company.findMany({
      where,
      include: {
        _count: {
          select: {
            teams: true,
            hakedisContracts: true,
            hakedisler: true,
            employees: true,
          },
        },
        hakedisContracts: {
          where: { type: "TASERON" },
          select: {
            id: true,
            name: true,
            totalAmount: true,
            currency: true,
          },
        },
        hakedisler: {
          where: { type: "TASERON" },
          select: {
            id: true,
            totalAmount: true,
            netAmount: true,
            status: true,
          },
        },
        taseronPerformanslar: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            genelPuan: true,
            period: true,
          },
        },
        taseronEvraklar: {
          where: {
            expiryDate: { not: null },
          },
          select: {
            id: true,
            type: true,
            expiryDate: true,
            status: true,
          },
        },
      } as any,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }) as any[];

    // KPI hesaplamaları
    const totalFirmalar = companies.length;
    const aktifFirmalar = companies.filter((c) => c.isActive).length;

    const toplamSozlesmeButcesi = companies.reduce((sum, c) => {
      return sum + c.hakedisContracts.reduce((s: number, hc: any) => s + hc.totalAmount, 0);
    }, 0);

    const toplamHakedis = companies.reduce((sum: number, c: any) => {
      return sum + c.hakedisler.reduce((s: number, h: any) => s + h.totalAmount, 0);
    }, 0);

    const ortalamaPerformans =
      companies.reduce((sum, c) => {
        const perf = c.taseronPerformanslar[0];
        return sum + (perf?.genelPuan || 0);
      }, 0) / (companies.filter((c) => c.taseronPerformanslar.length > 0).length || 1);

    // Süresi yaklaşan evraklar
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const suresiYaklasanEvrak = companies.reduce((count, c) => {
      return (
        count +
        c.taseronEvraklar.filter(
          (e: any) => e.expiryDate && e.expiryDate <= thirtyDaysLater && e.expiryDate > now
        ).length
      );
    }, 0);

    // Firma verisini düzenle
    const firmaListesi = companies.map((c) => ({
      id: c.id,
      name: c.name,
      specialization: c.specialization,
      contactPerson: c.contactPerson,
      contactPhone: c.contactPhone,
      phone: c.phone,
      email: c.email,
      city: c.city,
      isActive: c.isActive,
      rating: c.rating,
      sozlesmeCount: c.hakedisContracts.length,
      toplamSozlesmeTutar: c.hakedisContracts.reduce((s: number, hc: any) => s + hc.totalAmount, 0),
      toplamHakedis: c.hakedisler.reduce((s: number, h: any) => s + h.totalAmount, 0),
      bekleyenHakedis: c.hakedisler
        .filter((h: any) => h.status === "SUBMITTED")
        .reduce((s: number, h: any) => s + h.totalAmount, 0),
      sonPerformans: c.taseronPerformanslar[0] || null,
      calisanSayisi: c._count.employees,
      ekipSayisi: c._count.teams,
      evrakUyari: c.taseronEvraklar.filter(
        (e: any) => e.expiryDate && e.expiryDate <= thirtyDaysLater
      ).length,
    }));

    return NextResponse.json({
      firmalar: firmaListesi,
      kpilar: {
        totalFirmalar,
        aktifFirmalar,
        toplamSozlesmeButcesi,
        toplamHakedis,
        ortalamaPerformans: Math.round(ortalamaPerformans * 10) / 10,
        suresiYaklasanEvrak,
      },
    });
  } catch (error) {
    console.error("Taşeron listesi hatası:", error);
    return NextResponse.json(
      { error: "Taşeron firmaları yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Yeni taşeron firma oluştur
export async function POST(request: NextRequest) {
  try {
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
    } = body;

    if (!name?.trim()) {
      return NextResponse.json(
        { error: "Firma adı zorunludur" },
        { status: 400 }
      );
    }

    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        type: "SUBCONTRACTOR" as const,
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        district: district?.trim() || null,
        taxOffice: taxOffice?.trim() || null,
        taxNo: taxNo?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        contactPhone: contactPhone?.trim() || null,
        specialization: specialization?.trim() || null,
        notes: notes?.trim() || null,
      } as any,
    });

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Taşeron oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Taşeron firma oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
