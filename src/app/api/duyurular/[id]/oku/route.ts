import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// POST - Duyuruyu okundu olarak işaretle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
    }

    const { id } = await params;

    // Duyuru var mı?
    const announcement = await prisma.announcement.findUnique({
      where: { id },
    });
    if (!announcement) {
      return NextResponse.json(
        { error: "Duyuru bulunamadı" },
        { status: 404 }
      );
    }

    // Okundu kaydı oluştur (varsa atla)
    await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: session.user.id,
        },
      },
      update: {},
      create: {
        announcementId: id,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Okundu işareti hatası:", error);
    return NextResponse.json(
      { error: "Okundu işaretlenirken bir hata oluştu" },
      { status: 500 }
    );
  }
}
