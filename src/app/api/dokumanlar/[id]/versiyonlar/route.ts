import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/dokumanlar/[id]/versiyonlar
 * Yeni versiyon ekle
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { fileName, fileUrl, fileSize, mimeType, changeNote } = body;

    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: "Dosya bilgileri gerekli" }, { status: 400 });
    }

    // Mevcut en yüksek versiyon numarasını bul
    const lastVersion = await prisma.documentVersion.findFirst({
      where: { documentId: id },
      orderBy: { versionNo: "desc" },
      select: { versionNo: true },
    });

    const nextVersionNo = (lastVersion?.versionNo ?? 0) + 1;

    const version = await prisma.documentVersion.create({
      data: {
        documentId: id,
        versionNo: nextVersionNo,
        fileName,
        fileUrl,
        fileSize: fileSize || 0,
        mimeType: mimeType || null,
        changeNote: changeNote?.trim() || null,
        uploadedById: session.user.id,
      },
      include: {
        uploadedBy: { select: { id: true, name: true } },
      },
    });

    // Dokümanın updatedAt'ını güncelle
    await prisma.document.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("POST /api/dokumanlar/[id]/versiyonlar error:", error);
    return NextResponse.json({ error: "Versiyon oluşturulamadı" }, { status: 500 });
  }
}
