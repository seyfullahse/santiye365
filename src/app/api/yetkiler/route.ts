/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logPermissionChange } from "@/lib/audit-log";

// GET — İzin listesi (tüm tanımlar + rol izinleri + kullanıcı özel izinleri)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // "permissions" | "role" | "user"
  const role = searchParams.get("role");
  const userId = searchParams.get("userId");

  // Tüm izin tanımları
  if (type === "permissions" || !type) {
    const permissions = await (prisma as any).permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });
    return NextResponse.json(permissions);
  }

  // Belirli rol izinleri
  if (type === "role" && role) {
    const rolePerms = await (prisma as any).rolePermission.findMany({
      where: { role },
      include: { permission: true },
      orderBy: { permission: { module: "asc" } },
    });
    return NextResponse.json(rolePerms);
  }

  // Belirli kullanıcı özel izinleri
  if (type === "user" && userId) {
    const userPerms = await (prisma as any).userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
        project: { select: { id: true, name: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { permission: { module: "asc" } },
    });
    return NextResponse.json(userPerms);
  }

  return NextResponse.json({ error: "Geçersiz parametre" }, { status: 400 });
}

// POST — Kullanıcıya özel izin ata
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await req.json();
  const { userId, permissionId, scope, projectId, companyId, granted, expiresAt } = body;

  if (!userId || !permissionId) {
    return NextResponse.json({ error: "userId ve permissionId zorunludur" }, { status: 400 });
  }

  try {
    const userPerm = await (prisma as any).userPermission.upsert({
      where: {
        userId_permissionId_projectId_companyId: {
          userId,
          permissionId,
          projectId: projectId || null,
          companyId: companyId || null,
        },
      },
      create: {
        userId,
        permissionId,
        scope: scope || "GLOBAL",
        projectId: projectId || null,
        companyId: companyId || null,
        granted: granted !== false,
        grantedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      update: {
        scope: scope || "GLOBAL",
        granted: granted !== false,
        grantedBy: session.user.id,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      include: { permission: true },
    });

    // Audit log
    await logPermissionChange(
      session.user.id,
      userId,
      `Kullanıcıya ${userPerm.permission.module}:${userPerm.permission.action} izni ${granted !== false ? "verildi" : "kaldırıldı"}`,
      undefined,
      { permissionId, scope, projectId, companyId, granted }
    );

    return NextResponse.json(userPerm);
  } catch (err: any) {
    console.error("İzin atama hatası:", err);
    return NextResponse.json({ error: err?.message || "İzin atanamadı" }, { status: 500 });
  }
}

// DELETE — Kullanıcı özel iznini kaldır
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id parametresi zorunludur" }, { status: 400 });
  }

  try {
    const existing = await (prisma as any).userPermission.findUnique({
      where: { id },
      include: { permission: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "İzin bulunamadı" }, { status: 404 });
    }

    await (prisma as any).userPermission.delete({ where: { id } });

    await logPermissionChange(
      session.user.id,
      existing.userId,
      `Kullanıcıdan ${existing.permission.module}:${existing.permission.action} izni kaldırıldı`,
      { permissionId: existing.permissionId, scope: existing.scope },
      undefined
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("İzin silme hatası:", err);
    return NextResponse.json({ error: err?.message || "İzin silinemedi" }, { status: 500 });
  }
}
