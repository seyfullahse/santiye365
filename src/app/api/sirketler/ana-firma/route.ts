import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Ana firmayı getir
export async function GET() {
  try {
    const mainCompany = await prisma.company.findFirst({
      where: { type: "MAIN" },
      include: { _count: { select: { teams: true, employees: true } } },
    });
    return NextResponse.json(mainCompany);
  } catch (error) {
    console.error("GET /api/sirketler/ana-firma error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

// POST — Ana firma oluştur (zaten varsa hata döner)
export async function POST(req: NextRequest) {
  try {
    const existing = await prisma.company.findFirst({ where: { type: "MAIN" } });
    if (existing) {
      return NextResponse.json({ error: "Ana firma zaten mevcut", company: existing }, { status: 409 });
    }

    const body = await req.json();
    const company = await prisma.company.create({
      data: {
        name: body.name,
        type: "MAIN",
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        city: body.city || null,
        district: body.district || null,
        taxOffice: body.taxOffice || null,
        taxNo: body.taxNo || null,
        contactPerson: body.contactPerson || null,
        contactPhone: body.contactPhone || null,
        website: body.website || null,
        sortOrder: 0,
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("POST /api/sirketler/ana-firma error:", error);
    return NextResponse.json({ error: "Ana firma oluşturulamadı" }, { status: 500 });
  }
}

// PUT — Ana firmayı güncelle
export async function PUT(req: NextRequest) {
  try {
    const mainCompany = await prisma.company.findFirst({ where: { type: "MAIN" } });
    if (!mainCompany) {
      return NextResponse.json({ error: "Ana firma bulunamadı" }, { status: 404 });
    }

    const body = await req.json();
    const updated = await prisma.company.update({
      where: { id: mainCompany.id },
      data: {
        name: body.name ?? mainCompany.name,
        phone: body.phone ?? null,
        email: body.email ?? null,
        address: body.address ?? null,
        city: body.city ?? null,
        district: body.district ?? null,
        taxOffice: body.taxOffice ?? null,
        taxNo: body.taxNo ?? null,
        contactPerson: body.contactPerson ?? null,
        contactPhone: body.contactPhone ?? null,
        website: body.website ?? null,
      },
    });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/sirketler/ana-firma error:", error);
    return NextResponse.json({ error: "Ana firma güncellenemedi" }, { status: 500 });
  }
}
