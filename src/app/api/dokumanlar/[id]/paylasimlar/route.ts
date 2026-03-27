import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/dokumanlar/[id]/paylasimlar
 * Doküman paylaşım listesi
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;

    const shares = await prisma.documentShare.findMany({
      where: { documentId: id },
      include: {
        sharedWith: { select: { id: true, name: true, email: true } },
        sharedBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(shares);
  } catch (error) {
    console.error("GET /api/dokumanlar/[id]/paylasimlar error:", error);
    return NextResponse.json({ error: "Veri alınamadı" }, { status: 500 });
  }
}

/**
 * POST /api/dokumanlar/[id]/paylasimlar
 * Dokümanı bir kullanıcıyla paylaş
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { sharedWithId, permission } = body;

    if (!sharedWithId) {
      return NextResponse.json({ error: "Paylaşılacak kullanıcı gerekli" }, { status: 400 });
    }

    // Zaten paylaşılmış mı kontrol et
    const existing = await prisma.documentShare.findUnique({
      where: { documentId_sharedWithId: { documentId: id, sharedWithId } },
    });

    if (existing) {
      // Güncelle
      const updated = await prisma.documentShare.update({
        where: { id: existing.id },
        data: { permission: permission || "VIEW" },
        include: {
          sharedWith: { select: { id: true, name: true, email: true } },
          sharedBy: { select: { id: true, name: true } },
        },
      });
      return NextResponse.json(updated);
    }

    const share = await prisma.documentShare.create({
      data: {
        documentId: id,
        sharedWithId,
        permission: permission || "VIEW",
        sharedById: session.user.id,
      },
      include: {
        sharedWith: { select: { id: true, name: true, email: true } },
        sharedBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    console.error("POST /api/dokumanlar/[id]/paylasimlar error:", error);
    return NextResponse.json({ error: "Paylaşım oluşturulamadı" }, { status: 500 });
  }
}

/**
 * DELETE /api/dokumanlar/[id]/paylasimlar
 * Paylaşımı kaldır — query: shareId
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json({ error: "Paylaşım ID gerekli" }, { status: 400 });
    }

    await prisma.documentShare.delete({ where: { id: shareId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/dokumanlar/[id]/paylasimlar error:", error);
    return NextResponse.json({ error: "Paylaşım kaldırılamadı" }, { status: 500 });
  }
}
