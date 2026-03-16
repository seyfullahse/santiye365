import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ana firma profilini getir
// Company MAIN = tek kaynak (iletişim, vergi bilgileri)
// CompanyProfile = ek alanlar (sektör, kuruluş yılı, logo, açıklama)
export async function GET() {
  try {
    const mainCompany = await prisma.company.findFirst({
      where: { type: "MAIN" },
      include: { _count: { select: { teams: true, employees: true } } },
    });

    if (!mainCompany) {
      return NextResponse.json({ error: "Ana firma tanımlı değil" }, { status: 404 });
    }

    // CompanyProfile'dan ek alanları al (varsa)
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: { name: mainCompany.name },
      });
    }

    return NextResponse.json({
      id: mainCompany.id,
      name: mainCompany.name,
      phone: mainCompany.phone,
      email: mainCompany.email,
      address: mainCompany.address,
      city: mainCompany.city,
      district: mainCompany.district,
      website: mainCompany.website,
      taxNo: mainCompany.taxNo,
      taxOffice: mainCompany.taxOffice,
      contactPerson: mainCompany.contactPerson,
      contactPhone: mainCompany.contactPhone,
      // CompanyProfile ek alanları
      sector: profile.sector,
      foundedYear: profile.foundedYear,
      logoUrl: profile.logoUrl,
      description: profile.description,
      // Meta
      _count: mainCompany._count,
      createdAt: mainCompany.createdAt,
      updatedAt: mainCompany.updatedAt,
    });
  } catch (error) {
    console.error("GET /api/organizasyon/profil error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

// PUT — Ana firma profilini güncelle
// Company MAIN güncellenir, CompanyProfile ek alanlar için kullanılır
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    const mainCompany = await prisma.company.findFirst({ where: { type: "MAIN" } });
    if (!mainCompany) {
      return NextResponse.json({ error: "Ana firma bulunamadı" }, { status: 404 });
    }

    // Company MAIN güncelle (tek kaynak)
    const updatedCompany = await prisma.company.update({
      where: { id: mainCompany.id },
      data: {
        name: body.name ?? mainCompany.name,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        district: body.district ?? null,
        website: body.website ?? null,
        taxNo: body.taxNo ?? null,
        taxOffice: body.taxOffice ?? null,
        contactPerson: body.contactPerson ?? null,
        contactPhone: body.contactPhone ?? null,
      },
    });

    // CompanyProfile ek alanları güncelle
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: { name: updatedCompany.name },
      });
    }

    const updatedProfile = await prisma.companyProfile.update({
      where: { id: profile.id },
      data: {
        name: updatedCompany.name, // Senkron tut
        sector: body.sector ?? null,
        foundedYear: body.foundedYear ? parseInt(body.foundedYear) : null,
        logoUrl: body.logoUrl ?? null,
        description: body.description ?? null,
      },
    });

    return NextResponse.json({
      id: updatedCompany.id,
      name: updatedCompany.name,
      phone: updatedCompany.phone,
      email: updatedCompany.email,
      address: updatedCompany.address,
      city: updatedCompany.city,
      district: updatedCompany.district,
      website: updatedCompany.website,
      taxNo: updatedCompany.taxNo,
      taxOffice: updatedCompany.taxOffice,
      contactPerson: updatedCompany.contactPerson,
      contactPhone: updatedCompany.contactPhone,
      sector: updatedProfile.sector,
      foundedYear: updatedProfile.foundedYear,
      logoUrl: updatedProfile.logoUrl,
      description: updatedProfile.description,
    });
  } catch (error) {
    console.error("PUT /api/organizasyon/profil error:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
