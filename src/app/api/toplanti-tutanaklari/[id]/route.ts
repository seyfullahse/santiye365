import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tek toplantı detayı
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        participants: { orderBy: { createdAt: "asc" } },
        columns: { orderBy: { sortOrder: "asc" } },
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            values: true,
            comments: { orderBy: { createdAt: "desc" } },
          },
        },
      },
    });

    if (!meeting) {
      return NextResponse.json({ error: "Toplantı bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Toplantı detay hatası:", error);
    return NextResponse.json({ error: "Toplantı yüklenemedi" }, { status: 500 });
  }
}

// PUT - Toplantı güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, type, status, date, location, startTime, endTime, notes, projectId } = body;

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(type !== undefined && { type }),
        ...(status !== undefined && { status }),
        ...(date !== undefined && { date: new Date(date) }),
        ...(location !== undefined && { location }),
        ...(startTime !== undefined && { startTime }),
        ...(endTime !== undefined && { endTime }),
        ...(notes !== undefined && { notes }),
        ...(projectId !== undefined && { projectId: projectId || null }),
      },
      include: {
        project: { select: { id: true, name: true } },
        participants: true,
        columns: { orderBy: { sortOrder: "asc" } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(meeting);
  } catch (error) {
    console.error("Toplantı güncelleme hatası:", error);
    return NextResponse.json({ error: "Toplantı güncellenemedi" }, { status: 500 });
  }
}

// DELETE - Toplantı sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Toplantı silme hatası:", error);
    return NextResponse.json({ error: "Toplantı silinemedi" }, { status: 500 });
  }
}
