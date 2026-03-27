import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/dokumanlar/klasorler/[id]
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, description, color, parentId, projectId } = body;

    const folder = await prisma.documentFolder.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(color !== undefined && { color }),
        ...(parentId !== undefined && { parentId: parentId || null }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        _count: { select: { documents: true, children: true } },
      },
    });

    return NextResponse.json(folder);
  } catch (error) {
    console.error("PUT /api/dokumanlar/klasorler/[id] error:", error);
    return NextResponse.json({ error: "Klasör güncellenemedi" }, { status: 500 });
  }
}

/**
 * DELETE /api/dokumanlar/klasorler/[id]
 */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;

    // Önce alt klasör ve doküman sayısını kontrol et
    const folder = await prisma.documentFolder.findUnique({
      where: { id },
      include: { _count: { select: { documents: true, children: true } } },
    });

    if (!folder) {
      return NextResponse.json({ error: "Klasör bulunamadı" }, { status: 404 });
    }

    if (folder._count.children > 0) {
      return NextResponse.json({ error: "Alt klasörleri olan bir klasör silinemez" }, { status: 400 });
    }

    if (folder._count.documents > 0) {
      return NextResponse.json({ error: "İçinde doküman olan bir klasör silinemez" }, { status: 400 });
    }

    await prisma.documentFolder.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dokumanlar/klasorler/[id] error:", error);
    return NextResponse.json({ error: "Klasör silinemedi" }, { status: 500 });
  }
}
