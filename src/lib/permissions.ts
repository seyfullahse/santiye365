/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Şantiye360 — Rol & Yetki Yönetimi (Server-side — DB bağımlı)
 * 
 * Edge runtime'da KULLANILMAZ. Middleware ve client için permissions-shared.ts kullanılır.
 */

import { prisma } from "@/lib/prisma";

// Paylaşılan tip ve sabitler — re-export
export {
  type PermissionScope,
  type PermissionCheck,
  type PermissionResult,
  type UserContext,
  DEFAULT_ROLE_PERMISSIONS,
  PAGE_PERMISSION_MAP,
  SIDEBAR_MODULE_PERMISSIONS,
  ALL_PERMISSIONS,
  checkPermissionSync,
  getRolePermissions,
} from "@/lib/permissions-shared";

import type { PermissionScope, PermissionCheck, PermissionResult, UserContext } from "@/lib/permissions-shared";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions-shared";

// ─── Ana İzin Kontrol Fonksiyonu ────────────────────────────

/**
 * Kullanıcının belirli bir modül:aksiyon izni olup olmadığını kontrol eder.
 * Önce DB'deki UserPermission (override) kontrol edilir, sonra RolePermission,
 * son olarak hardcoded DEFAULT_ROLE_PERMISSIONS fallback kullanılır.
 */
export async function checkPermission(
  userCtx: UserContext,
  permission: PermissionCheck
): Promise<PermissionResult> {
  const key = `${permission.module}:${permission.action}`;

  // 1) SUPER_ADMIN her zaman full erişim
  if (userCtx.role === "SUPER_ADMIN") {
    return { allowed: true, scope: "GLOBAL" };
  }

  try {
    // 2) Kullanıcı özel izin kontrolü (UserPermission — override)
    const userPerms = await (prisma as any).userPermission.findMany({
      where: {
        userId: userCtx.userId,
        permission: {
          module: permission.module,
          action: permission.action,
        },
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
      include: { permission: true },
    });

    if (userPerms.length > 0) {
      // Özel izin var — granted=false ise engelle
      const denied = userPerms.find((up: any) => !up.granted);
      if (denied) {
        return { allowed: false, scope: "NONE" };
      }

      // En geniş scope'u bul
      const scopes = userPerms.map((up: any) => up.scope as PermissionScope);
      const bestScope = getBestScope(scopes);

      // Proje/firma ID'leri topla
      const projectIds = userPerms.filter((up: any) => up.projectId).map((up: any) => up.projectId);
      const companyIds = userPerms.filter((up: any) => up.companyId).map((up: any) => up.companyId);

      return {
        allowed: true,
        scope: bestScope,
        projectIds: projectIds.length > 0 ? projectIds : undefined,
        companyIds: companyIds.length > 0 ? companyIds : undefined,
      };
    }

    // 3) Rol varsayılan izin kontrolü (RolePermission — DB)
    const rolePerm = await (prisma as any).rolePermission.findFirst({
      where: {
        role: userCtx.role,
        permission: {
          module: permission.module,
          action: permission.action,
        },
      },
    });

    if (rolePerm) {
      const scope = rolePerm.scope as PermissionScope;
      if (scope === "NONE") return { allowed: false, scope: "NONE" };

      // PROJECT scope ise kullanıcının atandığı projeleri bul
      if (scope === "PROJECT") {
        const projectIds = await getUserProjectIds(userCtx);
        return { allowed: true, scope, projectIds };
      }

      return { allowed: true, scope };
    }
  } catch {
    // DB hatası — fallback'e devam
  }

  // 4) Hardcoded fallback
  const rolePerms = DEFAULT_ROLE_PERMISSIONS[userCtx.role];
  if (!rolePerms) return { allowed: false, scope: "NONE" };

  const scope = rolePerms[key];
  if (!scope || scope === "NONE") return { allowed: false, scope: "NONE" };

  if (scope === "PROJECT") {
    const projectIds = await getUserProjectIds(userCtx);
    return { allowed: true, scope, projectIds };
  }

  return { allowed: true, scope };
}

// ─── Yardımcı Fonksiyonlar ──────────────────────────────────

const SCOPE_PRIORITY: PermissionScope[] = ["GLOBAL", "COMPANY", "PROJECT", "SELF", "NONE"];

function getBestScope(scopes: PermissionScope[]): PermissionScope {
  for (const s of SCOPE_PRIORITY) {
    if (scopes.includes(s)) return s;
  }
  return "NONE";
}

/**
 * Kullanıcının atandığı proje ID'lerini bulur.
 * Employee → Project bağlantısından veya UserPermission'daki projectId'lerden.
 */
async function getUserProjectIds(userCtx: UserContext): Promise<string[]> {
  const projectIds: string[] = [];

  try {
    // Employee üzerinden atandığı proje
    if (userCtx.employeeId) {
      const emp = await (prisma as any).employee.findUnique({
        where: { id: userCtx.employeeId },
        select: { projectId: true },
      });
      if (emp?.projectId) projectIds.push(emp.projectId);
    } else {
      // User → Employee bağlantısından
      const user = await (prisma as any).user.findUnique({
        where: { id: userCtx.userId },
        select: { employee: { select: { projectId: true } } },
      });
      if (user?.employee?.projectId) projectIds.push(user.employee.projectId);
    }

    // UserPermission'daki proje bazlı izinler
    const userPerms = await (prisma as any).userPermission.findMany({
      where: {
        userId: userCtx.userId,
        projectId: { not: null },
        granted: true,
      },
      select: { projectId: true },
      distinct: ["projectId"],
    });

    for (const up of userPerms) {
      if (up.projectId && !projectIds.includes(up.projectId)) {
        projectIds.push(up.projectId);
      }
    }
  } catch {
    // DB hatası — boş dön
  }

  return projectIds;
}

// ─── API Route Koruma Helper'ları ───────────────────────────

/**
 * API route'larında kullanılacak izin kontrolü.
 * Session'dan user context oluşturur ve izni kontrol eder.
 */
export async function requirePermission(
  session: any,
  permission: PermissionCheck
): Promise<PermissionResult> {
  if (!session?.user) {
    return { allowed: false, scope: "NONE" };
  }

  const userCtx: UserContext = {
    userId: session.user.id,
    role: session.user.role,
    employeeId: session.user.employeeId || null,
  };

  return checkPermission(userCtx, permission);
}

/**
 * Silme yetkisi kontrolü — çok kısıtlı roller
 */
export function canDelete(role: string, module: string): boolean {
  const deleteRoles: Record<string, string[]> = {
    "kullanicilar": ["SUPER_ADMIN"],
    "projeler": ["SUPER_ADMIN", "ADMIN"],
    "hakedis": ["SUPER_ADMIN"],
    "puantaj": ["SUPER_ADMIN", "ADMIN"],
    "ik": ["SUPER_ADMIN", "ADMIN"],
    "duyurular": ["SUPER_ADMIN", "ADMIN"],
    "isg": ["SUPER_ADMIN", "ADMIN"],
  };

  const allowed = deleteRoles[module];
  if (!allowed) {
    // Tanımlı değilse sadece SUPER_ADMIN ve ADMIN
    return ["SUPER_ADMIN", "ADMIN"].includes(role);
  }
  return allowed.includes(role);
}
