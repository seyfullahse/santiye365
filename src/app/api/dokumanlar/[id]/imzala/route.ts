import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * PUT /api/dokumanlar/[id]/imzala
 * Dokümanı imzala
 */
export async function PUT(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Oturum bulunamadı" }, { status: 401 });
    }

    const { id } = await params;

    const document = await prisma.document.findUnique({
      where: { id },
      select: { requiresSign: true, signedAt: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Doküman bulunamadı" }, { status: 404 });
    }

    if (!document.requiresSign) {
      return NextResponse.json({ error: "Bu doküman imza gerektirmiyor" }, { status: 400 });
    }

    if (document.signedAt) {
      return NextResponse.json({ error: "Bu doküman zaten imzalı" }, { status: 400 });
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        signedAt: new Date(),
        signedById: session.user.id,
        status: "ONAYLANDI",
      },
      include: {
        signedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/dokumanlar/[id]/imzala error:", error);
    return NextResponse.json({ error: "Doküman imzalanamadı" }, { status: 500 });
  }
}
