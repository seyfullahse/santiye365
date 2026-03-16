/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Şantiye360 — Denetim Kaydı (Audit Log) Sistemi
 *
 * Kim, ne yaptı, ne zaman, nereden?
 * Tüm önemli işlemleri otomatik loglar.
 */

import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

type AuditAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "LOGIN"
  | "LOGOUT"
  | "APPROVE"
  | "REJECT"
  | "EXPORT"
  | "PERMISSION_CHANGE";

interface AuditLogParams {
  userId?: string | null;
  action: AuditAction;
  module: string;
  entityType?: string;
  entityId?: string;
  oldData?: Record<string, any> | null;
  newData?: Record<string, any> | null;
  description?: string;
}

/**
 * Denetim kaydı oluşturur — fire-and-forget (hata durumunda sessizce devam eder)
 */
export async function createAuditLog(params: AuditLogParams): Promise<void> {
  try {
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    try {
      const headersList = await headers();
      ipAddress =
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip") ||
        null;
      userAgent = headersList.get("user-agent") || null;
    } catch {
      // headers() server component dışında çalışmaz — sorun değil
    }

    await (prisma as any).auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        module: params.module,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        oldData: params.oldData || undefined,
        newData: params.newData || undefined,
        description: params.description || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (err) {
    console.error("[AuditLog] Kayıt oluşturulamadı:", err);
  }
}

/**
 * Oturum açma logunu kaydeder
 */
export async function logLogin(userId: string, email: string): Promise<void> {
  await createAuditLog({
    userId,
    action: "LOGIN",
    module: "auth",
    description: `${email} giriş yaptı`,
  });
}

/**
 * Oturum kapatma logunu kaydeder
 */
export async function logLogout(userId: string, email: string): Promise<void> {
  await createAuditLog({
    userId,
    action: "LOGOUT",
    module: "auth",
    description: `${email} çıkış yaptı`,
  });
}

/**
 * Yetki değişikliği logunu kaydeder
 */
export async function logPermissionChange(
  userId: string,
  targetUserId: string,
  description: string,
  oldData?: Record<string, any>,
  newData?: Record<string, any>
): Promise<void> {
  await createAuditLog({
    userId,
    action: "PERMISSION_CHANGE",
    module: "kullanicilar",
    entityType: "User",
    entityId: targetUserId,
    oldData,
    newData,
    description,
  });
}

/**
 * CRUD işlem logunu kaydeder — en çok kullanılacak helper
 */
export async function logCrud(
  userId: string,
  action: "CREATE" | "UPDATE" | "DELETE",
  module: string,
  entityType: string,
  entityId: string,
  description?: string,
  oldData?: Record<string, any> | null,
  newData?: Record<string, any> | null
): Promise<void> {
  await createAuditLog({
    userId,
    action,
    module,
    entityType,
    entityId,
    oldData,
    newData,
    description,
  });
}
