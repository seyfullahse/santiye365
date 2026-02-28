import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET — Sözleşme listesi
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type"); // ISVEREN | TASERON
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (projectId) where.projectId = projectId;

    const contracts = await prisma.hakedisContract.findMany({
      where,
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(contracts);
  } catch (error) {
    console.error("Sözleşme listesi hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST — Yeni sözleşme oluştur
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      type,
      projectId,
      companyId,
      contractNo,
      contractDate,
      advanceRate = 0,
      retentionRate = 0,
      description,
      currency = "TRY",
      pricingModel = "AYRINTILI",
    } = body;

    if (!name || !projectId || !type) {
      return NextResponse.json(
        { error: "Sözleşme adı, proje ve tip zorunludur" },
        { status: 400 }
      );
    }

    const contract = await prisma.hakedisContract.create({
      data: {
        name,
        type,
        projectId,
        companyId: companyId || null,
        contractNo: contractNo || null,
        contractDate: contractDate ? new Date(contractDate) : null,
        advanceRate,
        retentionRate,
        totalAmount: 0,
        description: description || null,
        currency: currency || "TRY",
        pricingModel: pricingModel || "AYRINTILI",
      },
      include: {
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(contract, { status: 201 });
  } catch (error) {
    console.error("Sözleşme oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
