/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

// Uygulama içinde kullandığımız bildirim tipleri
const NOTIFICATION_TYPES = [
  "APPROVAL_PENDING",
  "APPROVAL_APPROVED",
  "APPROVAL_REJECTED",
  "APPROVAL_ESCALATED",
  "LEAVE_REQUEST",
  "ANNOUNCEMENT",
  "PROJECT_ASSIGNMENT",
  "SLA_WARNING",
  "SYSTEM",
  "REMINDER",
] as const;

// GET — Kullanıcının bildirim tercihlerini getir
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  try {
    const prefs = await (prisma as any).notificationPreference.findMany({
      where: { userId: session.user.id },
    });

    // Tüm tipleri varsayılan değerlerle birleştir
    const result: Record<string, { inApp: boolean; email: boolean }> = {};
    for (const type of NOTIFICATION_TYPES) {
      const pref = prefs.find((p: any) => p.notificationType === type);
      result[type] = {
        inApp: pref?.inApp ?? true,
        email: pref?.email ?? false,
      };
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Bildirim tercih okuma hatası:", err);
    return NextResponse.json({ error: "Tercihler alınamadı" }, { status: 500 });
  }
}

// PUT — Kullanıcının bildirim tercihlerini güncelle
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await req.json();
  // body: Record<NotificationType, { inApp: boolean; email: boolean }>

  try {
    const upserts = Object.entries(body)
      .filter(([type]) => NOTIFICATION_TYPES.includes(type as any))
      .map(([type, val]: [string, any]) =>
        (prisma as any).notificationPreference.upsert({
          where: {
            userId_notificationType: {
              userId: session.user.id,
              notificationType: type,
            },
          },
          create: {
            userId: session.user.id,
            notificationType: type,
            inApp: val.inApp ?? true,
            email: val.email ?? false,
          },
          update: {
            inApp: val.inApp ?? true,
            email: val.email ?? false,
          },
        })
      );

    await Promise.all(upserts);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Bildirim tercih kaydetme hatası:", err);
    return NextResponse.json({ error: "Tercihler kaydedilemedi" }, { status: 500 });
  }
}
