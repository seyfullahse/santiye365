import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ana firma profilini getir
// Önce MAIN Company'den çek, yoksa CompanyProfile'dan çek
export async function GET() {
  try {
    // Önce MAIN Company'den bilgileri al
    const mainCompany = await prisma.company.findFirst({ where: { type: "MAIN" } });
    
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: { name: mainCompany?.name ?? "Ana Firma" },
      });
    }
    
    // MAIN Company varsa, profili onunla senkronize et
    if (mainCompany) {
      return NextResponse.json({
        ...profile,
        name: mainCompany.name,
        phone: mainCompany.phone ?? profile.phone,
        email: mainCompany.email ?? profile.email,
        address: mainCompany.address ?? profile.address,
        website: mainCompany.website ?? profile.website,
        taxNo: mainCompany.taxNo ?? profile.taxNo,
        taxOffice: mainCompany.taxOffice ?? profile.taxOffice,
      });
    }
    
    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/organizasyon/profil error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

// PUT — Ana firma profilini güncelle (hem CompanyProfile hem MAIN Company)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // CompanyProfile güncelle
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: { name: "Ana Firma" },
      });
    }

    const updated = await prisma.companyProfile.update({
      where: { id: profile.id },
      data: {
        name: body.name ?? profile.name,
        taxNo: body.taxNo ?? null,
        taxOffice: body.taxOffice ?? null,
        address: body.address ?? null,
        phone: body.phone ?? null,
        email: body.email ?? null,
        website: body.website ?? null,
        sector: body.sector ?? null,
        foundedYear: body.foundedYear ? parseInt(body.foundedYear) : null,
        logoUrl: body.logoUrl ?? null,
        description: body.description ?? null,
      },
    });

    // MAIN Company'yi de senkronize et
    const mainCompany = await prisma.company.findFirst({ where: { type: "MAIN" } });
    if (mainCompany) {
      await prisma.company.update({
        where: { id: mainCompany.id },
        data: {
          name: body.name ?? mainCompany.name,
          phone: body.phone ?? null,
          email: body.email ?? null,
          address: body.address ?? null,
          website: body.website ?? null,
          taxNo: body.taxNo ?? null,
          taxOffice: body.taxOffice ?? null,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/organizasyon/profil error:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
