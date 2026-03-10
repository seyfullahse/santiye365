import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET - Duyuru listesi (filtreleme + okunma durumu)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const priority = searchParams.get("priority");
    const search = searchParams.get("search");
    const pinnedOnly = searchParams.get("pinnedOnly") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const where: Record<string, unknown> = {
      isActive: true,
      publishDate: { lte: new Date() },
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    };

    if (categoryId && categoryId !== "all") {
      where.categoryId = categoryId;
    }
    if (priority && priority !== "all") {
      where.priority = priority;
    }
    if (pinnedOnly) {
      where.isPinned = true;
    }
    if (search?.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: "insensitive" } },
        { content: { contains: search.trim(), mode: "insensitive" } },
      ];
      // Tarih/sona erme filtresini AND olarak ekle
      where.AND = [
        { publishDate: { lte: new Date() } },
        {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
      ];
      // İlk OR'u kaldır (search bağlamında üzerine yazdık)
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          category: true,
          author: { select: { id: true, name: true } },
          reads: userId ? { where: { userId }, select: { id: true } } : false,
          _count: { select: { reads: true } },
        },
        orderBy: [{ isPinned: "desc" }, { publishDate: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.announcement.count({ where }),
    ]);

    // Okundu bilgisini ekle
    const result = announcements.map((a) => ({
      ...a,
      isRead: userId ? (a.reads as { id: string }[]).length > 0 : false,
      readCount: a._count.reads,
      reads: undefined,
      _count: undefined,
    }));

    return NextResponse.json({
      announcements: result,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Duyuru listesi hatası:", JSON.stringify(error, null, 2));
    return NextResponse.json(
      { error: "Duyurular yüklenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}

// POST - Yeni duyuru oluştur
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

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
    } = body;

    if (!title?.trim() || !content?.trim() || !categoryId) {
      return NextResponse.json(
        { error: "Başlık, içerik ve kategori zorunludur" },
        { status: 400 }
      );
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        categoryId,
        priority: priority || "NORMAL",
        isPinned: isPinned || false,
        targetType: targetType || "EVERYONE",
        targetRoles: targetRoles || [],
        authorId: session.user.id,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: {
        category: true,
        author: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error("Duyuru oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Duyuru oluşturulurken bir hata oluştu" },
      { status: 500 }
    );
  }
}
