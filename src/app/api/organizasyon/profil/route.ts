import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ana firma profilini getir (singleton)
export async function GET() {
  try {
    let profile = await prisma.companyProfile.findFirst();
    if (!profile) {
      profile = await prisma.companyProfile.create({
        data: { name: "Ana Firma" },
      });
    }
    return NextResponse.json(profile);
  } catch (error) {
    console.error("GET /api/organizasyon/profil error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

// PUT — Ana firma profilini güncelle
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();

    // Singleton — find first or create
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/organizasyon/profil error:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}
