/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encode, decode } from "next-auth/jwt";
import { cookies } from "next/headers";

const COOKIE_NAME = "authjs.session-token";
const ORIGINAL_COOKIE = "authjs.original-admin-token";
const secret = process.env.AUTH_SECRET!;

/**
 * POST /api/kullanicilar/impersonate
 * SUPER_ADMIN başka bir kullanıcının hesabına geçiş yapar
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const currentRole = (session?.user as any)?.role;
  const isImpersonating = (session?.user as any)?.isImpersonating;

  // Sadece gerçek SUPER_ADMIN (taklit etmeyen) kullanabilir
  if (!session?.user?.id || currentRole !== "SUPER_ADMIN" || isImpersonating) {
    return NextResponse.json(
      { error: "Bu işlem sadece Süper Admin tarafından yapılabilir" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const targetUserId = body.targetUserId;

  if (!targetUserId) {
    return NextResponse.json(
      { error: "Hedef kullanıcı ID gerekli" },
      { status: 400 }
    );
  }

  // Kendi hesabına geçiş yapılamaz
  if (targetUserId === session.user.id) {
    return NextResponse.json(
      { error: "Kendi hesabınıza taklit giriş yapamazsınız" },
      { status: 400 }
    );
  }

  // Hedef kullanıcıyı getir
  const targetUser = await (prisma.user as any).findUnique({
    where: { id: targetUserId },
    select: { id: true, name: true, email: true, role: true, isActive: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  if (!targetUser.isActive) {
    return NextResponse.json(
      { error: "Pasif hesaba giriş yapılamaz" },
      { status: 400 }
    );
  }

  // Mevcut admin token'ını yedekle
  const cookieStore = await cookies();
  const currentToken = cookieStore.get(COOKIE_NAME)?.value;

  if (!currentToken) {
    return NextResponse.json(
      { error: "Oturum bilgisi bulunamadı" },
      { status: 401 }
    );
  }

  // Hedef kullanıcı için yeni JWT oluştur
  const newToken = await encode({
    token: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isImpersonating: true,
      originalAdminId: session.user.id,
      originalAdminName: session.user.name || "Admin",
      sub: targetUser.id,
    },
    secret,
    salt: COOKIE_NAME,
  });

  // Response oluştur ve cookie'leri ayarla
  const response = NextResponse.json({
    success: true,
    message: `${targetUser.name} olarak giriş yapıldı`,
    targetUser: {
      id: targetUser.id,
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
    },
  });

  // Orijinal admin token'ını sakla
  response.cookies.set(ORIGINAL_COOKIE, currentToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
    maxAge: 60 * 60 * 4, // 4 saat
  });

  // Session token'ını hedef kullanıcının token'ı ile değiştir
  response.cookies.set(COOKIE_NAME, newToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
  });

  return response;
}

/**
 * DELETE /api/kullanicilar/impersonate
 * Taklit oturumunu sonlandır, orijinal admin hesabına dön
 */
export async function DELETE() {
  const cookieStore = await cookies();
  const originalToken = cookieStore.get(ORIGINAL_COOKIE)?.value;

  if (!originalToken) {
    return NextResponse.json(
      { error: "Orijinal oturum bulunamadı. Normal çıkış yapın." },
      { status: 400 }
    );
  }

  // Orijinal token'ı doğrula
  const decoded = await decode({
    token: originalToken,
    secret,
    salt: COOKIE_NAME,
  });

  if (!decoded || decoded.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Orijinal oturum geçersiz" },
      { status: 403 }
    );
  }

  const response = NextResponse.json({
    success: true,
    message: "Kendi hesabınıza geri dönüldü",
  });

  // Orijinal session token'ını geri yükle
  response.cookies.set(COOKIE_NAME, originalToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
  });

  // Yedek cookie'yi sil
  response.cookies.set(ORIGINAL_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
