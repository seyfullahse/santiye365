/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { logPermissionChange } from "@/lib/audit-log";

// PUT — Rol izinlerini toplu güncelle
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await req.json();
  const { role, permissions } = body;
  // permissions: [{ permissionId: string, scope: PermissionScope }]

  if (!role || !Array.isArray(permissions)) {
    return NextResponse.json(
      { error: "role ve permissions dizisi zorunludur" },
      { status: 400 }
    );
  }

  // SUPER_ADMIN izinleri değiştirilemez
  if (role === "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "SUPER_ADMIN rol izinleri değiştirilemez" },
      { status: 400 }
    );
  }

  try {
    // Mevcut rol izinlerini temizle, yenilerini yaz
    await (prisma as any).$transaction(async (tx: any) => {
      // Eski izinleri kaydet (audit için)
      const oldPerms = await tx.rolePermission.findMany({
        where: { role },
        include: { permission: true },
      });

      // Hepsini sil
      await tx.rolePermission.deleteMany({ where: { role } });

      // Yenilerini oluştur (sadece scope != NONE olanları)
      const toCreate = permissions.filter(
        (p: any) => p.scope && p.scope !== "NONE"
      );

      if (toCreate.length > 0) {
        await tx.rolePermission.createMany({
          data: toCreate.map((p: any) => ({
            role,
            permissionId: p.permissionId,
            scope: p.scope,
          })),
        });
      }

      // Audit log
      await logPermissionChange(
        session.user.id,
        undefined,
        `${role} rolü izinleri güncellendi (${toCreate.length} izin)`,
        {
          role,
          permissions: oldPerms.map((p: any) => ({
            module: p.permission.module,
            action: p.permission.action,
            scope: p.scope,
          })),
        },
        {
          role,
          permissions: toCreate.map((p: any) => ({
            permissionId: p.permissionId,
            scope: p.scope,
          })),
        }
      );
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Rol izin güncelleme hatası:", err);
    return NextResponse.json(
      { error: err?.message || "İzinler güncellenemedi" },
      { status: 500 }
    );
  }
}

// GET — Tüm roller için izin matrisi
export async function GET() {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  try {
    const [permissions, rolePermissions] = await Promise.all([
      (prisma as any).permission.findMany({
        orderBy: [{ module: "asc" }, { action: "asc" }],
      }),
      (prisma as any).rolePermission.findMany({
        include: { permission: true },
      }),
    ]);

    // Rol bazlı gruplayarak döndür
    const matrix: Record<string, Record<string, string>> = {};
    const roles = [
      "SUPER_ADMIN",
      "ADMIN",
      "PROJECT_ADMIN",
      "MANAGER",
      "MUHASEBE",
      "USER",
      "VIEWER",
    ];

    for (const role of roles) {
      matrix[role] = {};
      const perms = rolePermissions.filter((rp: any) => rp.role === role);
      for (const rp of perms) {
        matrix[role][`${rp.permission.module}:${rp.permission.action}`] =
          rp.scope;
      }
    }

    return NextResponse.json({ permissions, matrix, roles });
  } catch (err: any) {
    console.error("İzin matrisi hatası:", err);
    return NextResponse.json(
      { error: err?.message || "İzin matrisi alınamadı" },
      { status: 500 }
    );
  }
}
