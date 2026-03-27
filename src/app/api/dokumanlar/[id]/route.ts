import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dokumanlar/[id]
 * Doküman detayı — tüm versiyonlar, paylaşımlar
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        folder: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        signedBy: { select: { id: true, name: true } },
        versions: {
          include: {
            uploadedBy: { select: { id: true, name: true } },
          },
          orderBy: { versionNo: "desc" },
        },
        shares: {
          include: {
            sharedWith: { select: { id: true, name: true, email: true } },
            sharedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { versions: true, shares: true } },
      },
    });

    if (!document) {
      return NextResponse.json({ error: "Doküman bulunamadı" }, { status: 404 });
    }

    // tags alanını diziye dönüştür
    const result = {
      ...document,
      tags: document.tags ? document.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/dokumanlar/[id] error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

/**
 * PUT /api/dokumanlar/[id]
 * Doküman güncelle
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      title, description, folderId, projectId, category,
      status: docStatus, isTemplate, requiresSign, tags,
    } = body;

    const document = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(folderId !== undefined && { folderId: folderId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
        ...(category !== undefined && { category }),
        ...(docStatus !== undefined && { status: docStatus }),
        ...(isTemplate !== undefined && { isTemplate }),
        ...(requiresSign !== undefined && { requiresSign }),
        ...(tags !== undefined && { tags: tags?.trim() || null }),
      },
      include: {
        folder: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        versions: { orderBy: { versionNo: "desc" }, take: 1 },
        _count: { select: { versions: true, shares: true } },
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("PUT /api/dokumanlar/[id] error:", error);
    return NextResponse.json({ error: "Doküman güncellenemedi" }, { status: 500 });
  }
}

/**
 * DELETE /api/dokumanlar/[id]
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;
    await prisma.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dokumanlar/[id] error:", error);
    return NextResponse.json({ error: "Doküman silinemedi" }, { status: 500 });
  }
}
