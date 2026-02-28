import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Tek duyuru detayı
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id },
      include: {
        category: true,
        author: { select: { id: true, name: true } },
        reads: userId ? { where: { userId }, select: { id: true } } : false,
        _count: { select: { reads: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: "Duyuru bulunamadı" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ...announcement,
      isRead: userId ? (announcement.reads as { id: string }[]).length > 0 : false,
      readCount: announcement._count.reads,
      reads: undefined,
      _count: undefined,
    });
  } catch (error) {
    console.error("Duyuru detay hatası:", error);
    return NextResponse.json(
      { error: "Duyuru yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// PUT - Duyuru güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      content,
      categoryId,
      priority,
      isPinned,
      targetType,
      targetRoles,
      publishDate,
      expiresAt,
      isActive,
    } = body;

    const announcement = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title?.trim() && { title: title.trim() }),
        ...(content?.trim() && { content: content.trim() }),
        ...(categoryId && { categoryId }),
        ...(priority && { priority }),
        ...(isPinned !== undefined && { isPinned }),
        ...(targetType && { targetType }),
        ...(targetRoles !== undefined && { targetRoles }),
        ...(publishDate !== undefined && { publishDate: publishDate ? new Date(publishDate) : new Date() }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        category: true,
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(announcement);
  } catch (error) {
    console.error("Duyuru güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Duyuru güncellenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// DELETE - Duyuru sil
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.announcement.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Duyuru silme hatası:", error);
    return NextResponse.json(
      { error: "Duyuru silinirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
