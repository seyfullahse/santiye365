import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Varsayılan sütunlar
const DEFAULT_COLUMNS = [
  { name: "Açıklama", type: "text", sortOrder: 0, width: 400 },
  { name: "Sorumlu", type: "text", sortOrder: 1, width: 180 },
  { name: "Termin Tarihi", type: "date", sortOrder: 2, width: 130 },
  { name: "Durum", type: "select", sortOrder: 3, width: 130, options: JSON.stringify(["Bekliyor", "Devam Ediyor", "Tamamlandı", "İptal"]) },
];

// GET - Toplantı listesi
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};
    if (projectId && projectId !== "all") where.projectId = projectId;
    if (type && type !== "all") where.type = type;
    if (status && status !== "all") where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ];
    }

    const meetings = await prisma.meeting.findMany({
      where,
      orderBy: [{ date: "desc" }, { meetingNo: "desc" }],
      include: {
        project: { select: { id: true, name: true } },
        participants: { select: { id: true, name: true, company: true, isPresent: true } },
        _count: { select: { items: true, columns: true } },
      },
    });

    return NextResponse.json(meetings);
  } catch (error) {
    console.error("Toplantı listesi hatası:", error);
    return NextResponse.json({ error: "Toplantılar yüklenemedi" }, { status: 500 });
  }
}

// POST - Yeni toplantı oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectId, title, type, date, location, startTime, endTime, notes, participants } = body;

    if (!title) {
      return NextResponse.json({ error: "Başlık zorunludur" }, { status: 400 });
    }

    // Otomatik toplantı numarası
    const lastMeeting = await prisma.meeting.findFirst({
      where: projectId ? { projectId } : {},
      orderBy: { meetingNo: "desc" },
      select: { meetingNo: true },
    });
    const meetingNo = (lastMeeting?.meetingNo ?? 0) + 1;

    const meeting = await prisma.meeting.create({
      data: {
        projectId: projectId || null,
        title,
        meetingNo,
        type: type || "KOORDINASYON",
        date: date ? new Date(date) : new Date(),
        location: location || null,
        startTime: startTime || null,
        endTime: endTime || null,
        notes: notes || null,
        // Varsayılan sütunlar
        columns: {
          create: DEFAULT_COLUMNS.map((col) => ({
            name: col.name,
            type: col.type,
            sortOrder: col.sortOrder,
            width: col.width,
            options: col.options || null,
          })),
        },
        // Katılımcılar
        ...(participants && participants.length > 0
          ? {
              participants: {
                create: participants.map((p: { name: string; company?: string; role?: string; email?: string; phone?: string }) => ({
                  name: p.name,
                  company: p.company || null,
                  role: p.role || null,
                  email: p.email || null,
                  phone: p.phone || null,
                })),
              },
            }
          : {}),
      },
      include: {
        project: { select: { id: true, name: true } },
        participants: true,
        columns: { orderBy: { sortOrder: "asc" } },
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error("Toplantı oluşturma hatası:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Toplantı oluşturulamadı" },
      { status: 500 }
    );
  }
}
