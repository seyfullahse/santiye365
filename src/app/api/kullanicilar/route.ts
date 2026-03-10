/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET — Tüm kullanıcıları listele (SUPER_ADMIN veya ADMIN)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const withStats = searchParams.get("stats") === "true";

  const users = await (prisma.user as any).findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      lastLoginAt: true,
      createdAt: true,
      employeeId: true,
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeNo: true,
          department: { select: { id: true, name: true } },
          position: { select: { id: true, name: true } },
          company: { select: { id: true, name: true } },
          project: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (withStats) {
    const total = users.length;
    const active = users.filter((u: any) => u.isActive).length;
    const withEmployee = users.filter((u: any) => u.employeeId).length;
    const roleCounts: Record<string, number> = {};
    users.forEach((u: any) => {
      roleCounts[u.role] = (roleCounts[u.role] || 0) + 1;
    });
    return NextResponse.json({ users, stats: { total, active, withEmployee, roleCounts } });
  }

  return NextResponse.json(users);
}

// POST — Yeni kullanıcı oluştur (SUPER_ADMIN veya ADMIN)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, password, role, phone, employeeId } = body;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Ad, e-posta ve şifre zorunludur" },
      { status: 400 }
    );
  }

  // SUPER_ADMIN rolünü sadece SUPER_ADMIN atayabilir
  if (role === "SUPER_ADMIN" && session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "SUPER_ADMIN rolünü sadece SUPER_ADMIN atayabilir" },
      { status: 403 }
    );
  }

  // E-posta kontrolü
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "Bu e-posta adresi zaten kullanımda" },
      { status: 409 }
    );
  }

  // Employee kontrolü — zaten bağlı mı?
  if (employeeId) {
    const existingLink = await (prisma.user as any).findFirst({
      where: { employeeId },
    });
    if (existingLink) {
      return NextResponse.json(
        { error: "Bu çalışanın zaten bir kullanıcı hesabı var" },
        { status: 409 }
      );
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await (prisma.user as any).create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: role || "USER",
      phone: phone || null,
      employeeId: employeeId || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      phone: true,
      employeeId: true,
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

  return NextResponse.json(user, { status: 201 });
}
