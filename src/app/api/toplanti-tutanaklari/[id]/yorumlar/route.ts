import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST - Yorum ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const body = await request.json();
    const { itemId, content } = body;

    if (!itemId || !content) {
      return NextResponse.json(
        { error: "itemId ve content zorunludur" },
        { status: 400 }
      );
    }

    // Kullanıcı adını oturumdan al
    const authorName = session?.user?.name || "Anonim";
    const userId = (session?.user as any)?.id || null;

    const comment = await prisma.meetingComment.create({
      data: {
        itemId,
        author: authorName,
        content,
        userId,
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Yorum ekleme hatası:", error);
    return NextResponse.json({ error: "Yorum eklenemedi" }, { status: 500 });
  }
}

// DELETE - Yorum sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json({ error: "commentId zorunludur" }, { status: 400 });
    }

    await prisma.meetingComment.delete({ where: { id: commentId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Yorum silme hatası:", error);
    return NextResponse.json({ error: "Yorum silinemedi" }, { status: 500 });
  }
}
