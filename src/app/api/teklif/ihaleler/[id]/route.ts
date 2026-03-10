import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - İhale detayı
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tender = await prisma.tender.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        versions: {
          orderBy: { versionNo: "desc" },
          include: {
            _count: { select: { items: true } },
          },
        },
        comparisons: { orderBy: { rank: "asc" } },
      },
    });
    if (!tender) return NextResponse.json({ error: "İhale bulunamadı" }, { status: 404 });
    return NextResponse.json(tender);
  } catch (error: any) {
    return NextResponse.json({ error: "İhale yüklenemedi" }, { status: 500 });
  }
}

// PUT - İhale güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, employer, location, projectId, dueDate, startDate, duration, status, type, currency, notes, isArchived } = body;

    const tender = await prisma.tender.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(employer !== undefined && { employer: employer?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(duration !== undefined && { duration: duration ? parseInt(duration) : null }),
        ...(status !== undefined && { status }),
        ...(type !== undefined && { type }),
        ...(currency !== undefined && { currency }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isArchived !== undefined && { isArchived }),
      },
    });
    return NextResponse.json(tender);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Güncellenemedi" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.tender.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "İhale silinemedi" }, { status: 500 });
  }
}
