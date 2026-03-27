import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dokumanlar/klasorler
 * Klasör listesi — opsiyonel parentId ve projectId filtresi
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId");
    const projectId = searchParams.get("projectId");

    const where: Record<string, unknown> = {};
    if (parentId === "root" || !parentId) {
      where.parentId = null;
    } else {
      where.parentId = parentId;
    }
    if (projectId) where.projectId = projectId;

    const folders = await prisma.documentFolder.findMany({
      where,
      include: {
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { documents: true, children: true } },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("GET /api/dokumanlar/klasorler error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

/**
 * POST /api/dokumanlar/klasorler
 * Yeni klasör oluştur
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, parentId, projectId, color } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Klasör adı gerekli" }, { status: 400 });
    }

    // Proje ID doğrulama
    const cleanProjectId = (projectId && projectId !== "none" && projectId.trim() !== "") ? projectId.trim() : null;
    if (cleanProjectId) {
      const projectExists = await prisma.project.findUnique({ where: { id: cleanProjectId }, select: { id: true } });
      if (!projectExists) {
        return NextResponse.json({ error: "Belirtilen proje bulunamadı" }, { status: 400 });
      }
    }

    const folder = await prisma.documentFolder.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        parentId: parentId || null,
        projectId: cleanProjectId,
        color: color || "#6366f1",
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        _count: { select: { documents: true, children: true } },
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/dokumanlar/klasorler error:", error);
    const message = error instanceof Error ? error.message : "Klasör oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
