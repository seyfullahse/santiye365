import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

/* ─── GET /api/kullanicilar/profil ─── */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const user = await (prisma.user as any).findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatar: true,
      createdAt: true,
      lastLoginAt: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(user);
}

/* ─── PUT /api/kullanicilar/profil ─── */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const body = await request.json();
  const { name, email, phone, currentPassword, newPassword } = body;

  // Mevcut kullanıcıyı getir
  const user = await (prisma.user as any).findUnique({
    where: { id: session.user.id },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  // Şifre değişimi istenmişse mevcut şifreyi doğrula
  if (newPassword) {
    if (!currentPassword) {
      return NextResponse.json(
        { error: "Mevcut şifrenizi girmelisiniz" },
        { status: 400 }
      );
    }
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Mevcut şifre yanlış" },
        { status: 400 }
      );
    }
    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "Yeni şifre en az 6 karakter olmalı" },
        { status: 400 }
      );
    }
  }

  // E-posta değişikliği varsa benzersizliği kontrol et
  if (email && email !== user.email) {
    const existing = await (prisma.user as any).findUnique({
      where: { email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanılıyor" },
        { status: 400 }
      );
    }
  }

  // Güncelleme verilerini hazırla
  const updateData: Record<string, unknown> = {};
  if (name && name.trim()) updateData.name = name.trim();
  if (email && email.trim()) updateData.email = email.trim();
  if (phone !== undefined) updateData.phone = phone?.trim() || null;
  if (newPassword) {
    updateData.password = await bcrypt.hash(newPassword, 12);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "Güncellenecek alan bulunamadı" }, { status: 400 });
  }

  const updated = await (prisma.user as any).update({
    where: { id: session.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
    },
  });

  return NextResponse.json(updated);
}
