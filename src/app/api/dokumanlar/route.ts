import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dokumanlar
 * Doküman listesi — filtre: folderId, projectId, category, status, search, isTemplate
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get("folderId");
    const projectId = searchParams.get("projectId");
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const isTemplate = searchParams.get("isTemplate");
    const requiresSign = searchParams.get("requiresSign");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (folderId === "root") {
      where.folderId = null;
    } else if (folderId) {
      where.folderId = folderId;
    }
    if (projectId) where.projectId = projectId;
    if (category && category !== "ALL") where.category = category;
    if (status && status !== "ALL") where.status = status;
    if (isTemplate === "true") where.isTemplate = true;
    if (requiresSign === "true") where.requiresSign = true;

    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { description: { contains: search.trim(), mode: "insensitive" } },
        { tags: { contains: search.trim(), mode: "insensitive" } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        folder: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        signedBy: { select: { id: true, name: true } },
        versions: {
          select: { id: true, versionNo: true, fileName: true, fileSize: true, mimeType: true, createdAt: true },
          orderBy: { versionNo: "desc" },
          take: 1,
        },
        _count: { select: { versions: true, shares: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET /api/dokumanlar error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

/**
 * POST /api/dokumanlar
 * Yeni doküman oluştur
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const body = await req.json();
    const {
      title, description, folderId, projectId, category,
      status: docStatus, isTemplate, requiresSign, tags,
      fileName, fileUrl, fileSize, mimeType, changeNote,
    } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: "Doküman başlığı gerekli" }, { status: 400 });
    }

    // ID'leri temizle
    const cleanProjectId = (projectId && projectId !== "none" && projectId.trim() !== "") ? projectId.trim() : null;
    const cleanFolderId = (folderId && folderId !== "none" && folderId.trim() !== "") ? folderId.trim() : null;

    // tags alanını diziye dönüştür
    let parsedTags: string | null = null;
    if (tags && typeof tags === "string" && tags.trim()) {
      parsedTags = tags.trim();
    }

    const document = await prisma.document.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        folderId: cleanFolderId,
        projectId: cleanProjectId,
        category: category || "GENEL",
        status: docStatus || "TASLAK",
        isTemplate: isTemplate || false,
        requiresSign: requiresSign || false,
        tags: parsedTags,
        createdById: session.user.id,
        // İlk versiyon oluştur (dosya varsa)
        ...(fileName && fileUrl
          ? {
              versions: {
                create: {
                  versionNo: 1,
                  fileName,
                  fileUrl,
                  fileSize: fileSize || 0,
                  mimeType: mimeType || null,
                  changeNote: changeNote || "İlk versiyon",
                  uploadedById: session.user.id,
                },
              },
            }
          : {}),
      },
      include: {
        folder: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        versions: { orderBy: { versionNo: "desc" }, take: 1 },
        _count: { select: { versions: true, shares: true } },
      },
    });

    return NextResponse.json(document, { status: 201 });
  } catch (error: unknown) {
    console.error("POST /api/dokumanlar error:", error);
    const message = error instanceof Error ? error.message : "Doküman oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
