/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET — Tek kullanıcı detay
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id } = await params;

  const user = await (prisma.user as any).findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      avatar: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      employeeId: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          phone: true,
          email: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PUT — Kullanıcı güncelle (SUPER_ADMIN veya ADMIN)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const { name, email, password, role, phone, isActive, employeeId } = body;

  // SUPER_ADMIN rolünü sadece SUPER_ADMIN atayabilir
  if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "SUPER_ADMIN rolünü sadece SUPER_ADMIN atayabilir" },
      { status: 403 }
    );
  }

  // E-posta değiştiyse kontrol
  if (email) {
    const existing = await prisma.user.findFirst({
      where: { email, NOT: { id } },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanımda" },
        { status: 409 }
      );
    }
  }

  // Employee bağlantısı değiştiyse kontrol
  if (employeeId !== undefined && employeeId !== null) {
    const existingLink = await (prisma.user as any).findFirst({
      where: { employeeId, NOT: { id } },
    });
    if (existingLink) {
      return NextResponse.json(
        { error: "Bu çalışanın zaten bir kullanıcı hesabı var" },
        { status: 409 }
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (phone !== undefined) updateData.phone = phone || null;
  if (isActive !== undefined) updateData.isActive = isActive;
  if (employeeId !== undefined) updateData.employeeId = employeeId || null;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const user = await (prisma.user as any).update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      employeeId: true,
      lastLoginAt: true,
      createdAt: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          department: { select: { name: true } },
          position: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json(user);
}

// DELETE — Kullanıcı sil (SUPER_ADMIN veya ADMIN, kendini silemez)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json(
      { error: "Kendi hesabınızı silemezsiniz" },
      { status: 400 }
    );
  }

  // SUPER_ADMIN silmeye yalnızca SUPER_ADMIN yetkili
  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (target?.role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "SUPER_ADMIN kullanıcısını sadece SUPER_ADMIN silebilir" },
      { status: 403 }
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
