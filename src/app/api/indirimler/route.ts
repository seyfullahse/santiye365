import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: İndirim listesi
export async function GET(req: NextRequest) {
  try {
    const onlyActive = req.nextUrl.searchParams.get("active");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (onlyActive === "true") {
      where.isActive = true;
      where.OR = [
        { validUntil: null },
        { validUntil: { gte: new Date() } },
      ];
    }

    const discounts = await prisma.employeeDiscount.findMany({
      where,
      orderBy: [{ category: "asc" }, { discountRate: "desc" }],
    });

    return NextResponse.json(discounts);
  } catch (error) {
    console.error("İndirimler alınamadı:", error);
    return NextResponse.json({ error: "İndirimler alınamadı" }, { status: 500 });
  }
}

// POST: Yeni indirim ekle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, category, discountRate, description, logo, contactInfo, validUntil, isActive } = body;

    if (!companyName || !category || !discountRate) {
      return NextResponse.json({ error: "Firma adı, kategori ve indirim oranı zorunludur" }, { status: 400 });
    }

    const discount = await prisma.employeeDiscount.create({
      data: {
        companyName,
        category,
        discountRate: parseInt(discountRate),
        description: description || null,
        logo: logo || null,
        contactInfo: contactInfo || null,
        validUntil: validUntil ? new Date(validUntil + "T00:00:00.000Z") : null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(discount, { status: 201 });
  } catch (error) {
    console.error("İndirim oluşturulamadı:", error);
    return NextResponse.json({ error: "İndirim oluşturulamadı" }, { status: 500 });
  }
}

// PUT: İndirim güncelle
export async function PUT(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  try {
    const body = await req.json();
    const { companyName, category, discountRate, description, logo, contactInfo, validUntil, isActive } = body;

    const discount = await prisma.employeeDiscount.update({
      where: { id },
      data: {
        ...(companyName !== undefined && { companyName }),
        ...(category !== undefined && { category }),
        ...(discountRate !== undefined && { discountRate: parseInt(discountRate) }),
        description: description ?? null,
        logo: logo ?? null,
        contactInfo: contactInfo ?? null,
        validUntil: validUntil ? new Date(validUntil + "T00:00:00.000Z") : null,
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(discount);
  } catch (error) {
    console.error("İndirim güncellenemedi:", error);
    return NextResponse.json({ error: "İndirim güncellenemedi" }, { status: 500 });
  }
}

// DELETE: İndirim sil
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });

  try {
    await prisma.employeeDiscount.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("İndirim silinemedi:", error);
    return NextResponse.json({ error: "İndirim silinemedi" }, { status: 500 });
  }
}
