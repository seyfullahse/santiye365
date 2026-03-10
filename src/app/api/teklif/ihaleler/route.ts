import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - İhaleleri listele
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isArchived = searchParams.get("archived") === "true";
    const status = searchParams.get("status");

    const where: any = { isArchived };
    if (status) where.status = status;

    const tenders = await prisma.tender.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, name: true } },
        _count: { select: { versions: true, comparisons: true } },
        versions: {
          where: { isActive: true },
          select: { id: true, versionNo: true, totalCost: true, totalPrice: true, markup: true, overhead: true },
          take: 1,
          orderBy: { versionNo: "desc" },
        },
      },
    });
    return NextResponse.json(tenders);
  } catch (error: any) {
    console.error("İhale listesi hatası:", error?.message);
    return NextResponse.json({ error: "İhaleler yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni ihale oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, employer, location, projectId, dueDate, startDate, duration, type, currency, notes } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "İhale adı zorunludur" }, { status: 400 });
    }

    const tender = await prisma.tender.create({
      data: {
        name: name.trim(),
        employer: employer?.trim() || null,
        location: location?.trim() || null,
        projectId: projectId || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        startDate: startDate ? new Date(startDate) : null,
        duration: duration ? parseInt(duration) : null,
        type: type || "CLOSED",
        currency: currency || "TRY",
        notes: notes || null,
      },
    });

    // Otomatik ilk versiyon oluştur
    await prisma.tenderVersion.create({
      data: {
        tenderId: tender.id,
        versionNo: 1,
        name: "Rev.1",
      },
    });

    return NextResponse.json(tender, { status: 201 });
  } catch (error: any) {
    console.error("İhale oluşturma hatası:", error?.message);
    return NextResponse.json({ error: error?.message || "İhale oluşturulamadı" }, { status: 500 });
  }
}
