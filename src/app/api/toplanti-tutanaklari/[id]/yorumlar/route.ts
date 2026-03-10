import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - Yorum ekle
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { itemId, author, content, userId } = body;

    if (!itemId || !content) {
      return NextResponse.json(
        { error: "itemId ve content zorunludur" },
        { status: 400 }
      );
    }

    const comment = await prisma.meetingComment.create({
      data: {
        itemId,
        author: author || "Anonim",
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
