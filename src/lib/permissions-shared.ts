/**
 * Şantiye360 — Rol & Yetki Yönetimi (Edge-safe / Sync)
 * 
 * Bu dosya Edge Runtime (middleware) ve client tarafında güvenle import edilir.
 * Prisma/DB bağımlılığı YOKTUR.
 */

// ─── Tipler ────────────────────────────────────────────────

export type PermissionScope = "NONE" | "SELF" | "PROJECT" | "COMPANY" | "GLOBAL";

export interface PermissionCheck {
  module: string;
  action: string;
}

export interface PermissionResult {
  allowed: boolean;
  scope: PermissionScope;
  projectIds?: string[];
  companyIds?: string[];
}

export interface UserContext {
  userId: string;
  role: string;
  employeeId?: string | null;
}

// ─── Varsayılan Rol İzin Matrisi ─────────────────────────

export const DEFAULT_ROLE_PERMISSIONS: Record<string, Record<string, PermissionScope>> = {
  SUPER_ADMIN: {
    "projeler:read": "GLOBAL", "projeler:create": "GLOBAL", "projeler:update": "GLOBAL", "projeler:delete": "GLOBAL",
    "puantaj:read": "GLOBAL", "puantaj:write": "GLOBAL", "puantaj:delete": "GLOBAL",
    "hakedis:read": "GLOBAL", "hakedis:write": "GLOBAL", "hakedis:delete": "GLOBAL",
    "ik:read": "GLOBAL", "ik:write": "GLOBAL", "ik:delete": "GLOBAL",
    "izin:request": "GLOBAL", "izin:approve": "GLOBAL",
    "isg:read": "GLOBAL", "isg:write": "GLOBAL",
    "muhasebe:read": "GLOBAL", "muhasebe:write": "GLOBAL",
    "duyurular:read": "GLOBAL", "duyurular:create": "GLOBAL", "duyurular:delete": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "sirketler:read": "GLOBAL", "sirketler:write": "GLOBAL",
    "kullanicilar:read": "GLOBAL", "kullanicilar:write": "GLOBAL", "kullanicilar:delete": "GLOBAL",
    "crm:read": "GLOBAL", "crm:write": "GLOBAL",
    "taseron:read": "GLOBAL", "taseron:write": "GLOBAL",
    "toplanti:read": "GLOBAL", "toplanti:write": "GLOBAL",
    "sunum:read": "GLOBAL", "sunum:write": "GLOBAL",
    "teklif:read": "GLOBAL", "teklif:write": "GLOBAL",
    "yatirim:read": "GLOBAL", "yatirim:write": "GLOBAL",
    "organizasyon:read": "GLOBAL", "organizasyon:write": "GLOBAL",
    "maskot:read": "GLOBAL", "maskot:write": "GLOBAL",
    "ayarlar:read": "GLOBAL", "ayarlar:write": "GLOBAL",
    "roller:read": "GLOBAL", "roller:write": "GLOBAL",
    "dokumanlar:read": "GLOBAL", "dokumanlar:write": "GLOBAL", "dokumanlar:delete": "GLOBAL",
    "ai-analytics:read": "GLOBAL",
    "yonetim-paneli:read": "GLOBAL",
  },
  ADMIN: {
    "projeler:read": "GLOBAL", "projeler:create": "GLOBAL", "projeler:update": "GLOBAL",
    "puantaj:read": "GLOBAL", "puantaj:write": "GLOBAL", "puantaj:delete": "GLOBAL",
    "hakedis:read": "GLOBAL", "hakedis:write": "GLOBAL",
    "ik:read": "GLOBAL", "ik:write": "GLOBAL",
    "izin:request": "GLOBAL", "izin:approve": "GLOBAL",
    "isg:read": "GLOBAL", "isg:write": "GLOBAL",
    "muhasebe:read": "GLOBAL", "muhasebe:write": "GLOBAL",
    "duyurular:read": "GLOBAL", "duyurular:create": "GLOBAL", "duyurular:delete": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "sirketler:read": "GLOBAL", "sirketler:write": "GLOBAL",
    "kullanicilar:read": "GLOBAL", "kullanicilar:write": "GLOBAL",
    "crm:read": "GLOBAL", "crm:write": "GLOBAL",
    "taseron:read": "GLOBAL", "taseron:write": "GLOBAL",
    "toplanti:read": "GLOBAL", "toplanti:write": "GLOBAL",
    "sunum:read": "GLOBAL", "sunum:write": "GLOBAL",
    "teklif:read": "GLOBAL", "teklif:write": "GLOBAL",
    "yatirim:read": "GLOBAL", "yatirim:write": "GLOBAL",
    "organizasyon:read": "GLOBAL", "organizasyon:write": "GLOBAL",
    "maskot:read": "GLOBAL", "maskot:write": "GLOBAL",
    "ayarlar:read": "GLOBAL", "ayarlar:write": "GLOBAL",
    "roller:read": "GLOBAL", "roller:write": "GLOBAL",
    "dokumanlar:read": "GLOBAL", "dokumanlar:write": "GLOBAL", "dokumanlar:delete": "GLOBAL",
    "ai-analytics:read": "GLOBAL",
    "yonetim-paneli:read": "GLOBAL",
  },
  PROJECT_ADMIN: {
    "projeler:read": "PROJECT", "projeler:update": "PROJECT",
    "puantaj:read": "PROJECT", "puantaj:write": "PROJECT",
    "hakedis:read": "PROJECT", "hakedis:write": "PROJECT",
    "ik:read": "PROJECT", "ik:write": "PROJECT",
    "izin:request": "GLOBAL", "izin:approve": "PROJECT",
    "isg:read": "PROJECT", "isg:write": "PROJECT",
    "sirketler:read": "GLOBAL",
    "taseron:read": "PROJECT", "taseron:write": "PROJECT",
    "toplanti:read": "PROJECT", "toplanti:write": "PROJECT",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "dokumanlar:read": "PROJECT", "dokumanlar:write": "PROJECT",
    "organizasyon:read": "GLOBAL",
    "ayarlar:read": "SELF",
  },
  MANAGER: {
    "projeler:read": "PROJECT",
    "puantaj:read": "PROJECT", "puantaj:write": "PROJECT",
    "hakedis:read": "PROJECT",
    "ik:read": "PROJECT",
    "izin:request": "GLOBAL", "izin:approve": "GLOBAL",
    "isg:read": "PROJECT", "isg:write": "PROJECT",
    "sirketler:read": "GLOBAL",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "organizasyon:read": "GLOBAL",
    "toplanti:read": "PROJECT", "toplanti:write": "PROJECT",
    "dokumanlar:read": "PROJECT",
    "ayarlar:read": "SELF",
  },
  MUHASEBE: {
    "puantaj:read": "GLOBAL",
    "hakedis:read": "GLOBAL", "hakedis:write": "GLOBAL",
    "muhasebe:read": "GLOBAL", "muhasebe:write": "GLOBAL",
    "taseron:read": "GLOBAL",
    "sirketler:read": "GLOBAL",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "dokumanlar:read": "GLOBAL",
    "izin:request": "GLOBAL",
    "ayarlar:read": "SELF",
  },
  USER: {
    "projeler:read": "PROJECT",
    "puantaj:read": "SELF",
    "ik:read": "SELF",
    "izin:request": "GLOBAL",
    "isg:read": "SELF",
    "sirketler:read": "GLOBAL",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "dokumanlar:read": "SELF",
    "organizasyon:read": "GLOBAL",
    "ayarlar:read": "SELF",
  },
  VIEWER: {
    "projeler:read": "PROJECT",
    "duyurular:read": "GLOBAL",
    "indirimler:read": "GLOBAL",
    "sirketler:read": "GLOBAL",
    "organizasyon:read": "GLOBAL",
    "ayarlar:read": "SELF",
  },
};

// ─── Sayfa → Gerekli İzin Eşleşmesi ────────────────────────

export const PAGE_PERMISSION_MAP: Record<string, PermissionCheck> = {
  "/yonetim-paneli": { module: "yonetim-paneli", action: "read" },
  "/projeler": { module: "projeler", action: "read" },
  "/mahaller": { module: "projeler", action: "read" },
  "/katlar": { module: "projeler", action: "read" },
  "/aktiviteler": { module: "projeler", action: "read" },
  "/malzemeler": { module: "projeler", action: "read" },
  "/onaylar": { module: "projeler", action: "read" },
  "/riskler": { module: "projeler", action: "read" },
  "/puantaj": { module: "puantaj", action: "read" },
  "/hakedis": { module: "hakedis", action: "read" },
  "/muhasebe": { module: "muhasebe", action: "read" },
  "/ik": { module: "ik", action: "read" },
  "/isg": { module: "isg", action: "read" },
  "/crm": { module: "crm", action: "read" },
  "/taseron": { module: "taseron", action: "read" },
  "/duyurular": { module: "duyurular", action: "read" },
  "/indirimler": { module: "indirimler", action: "read" },
  "/sirketler": { module: "sirketler", action: "read" },
  "/ekipler": { module: "projeler", action: "read" },
  "/calisanlar": { module: "projeler", action: "read" },
  "/personel": { module: "ik", action: "read" },
  "/kullanicilar": { module: "kullanicilar", action: "read" },
  "/organizasyon": { module: "organizasyon", action: "read" },
  "/toplanti-tutanaklari": { module: "toplanti", action: "read" },
  "/sunum": { module: "sunum", action: "read" },
  "/teklif": { module: "teklif", action: "read" },
  "/yatirim": { module: "yatirim", action: "read" },
  "/maskot": { module: "maskot", action: "read" },
  "/dokumanlar": { module: "dokumanlar", action: "read" },
  "/ai-analytics": { module: "ai-analytics", action: "read" },
  "/roller": { module: "roller", action: "read" },
  "/ayarlar": { module: "ayarlar", action: "read" },
};

// ─── Senkron İzin Kontrolü ──────────────────────────────────

/**
 * Hızlı senkron izin kontrolü — sadece hardcoded matristen kontrol eder.
 * Middleware ve client tarafında kullanılır (DB sorgusu yapılamayan yerlerde).
 */
export function checkPermissionSync(role: string, permission: PermissionCheck): PermissionResult {
  const key = `${permission.module}:${permission.action}`;

  if (role === "SUPER_ADMIN") {
    return { allowed: true, scope: "GLOBAL" };
  }

  const rolePerms = DEFAULT_ROLE_PERMISSIONS[role];
  if (!rolePerms) return { allowed: false, scope: "NONE" };

  const scope = rolePerms[key];
  if (!scope || scope === "NONE") return { allowed: false, scope: "NONE" };

  return { allowed: true, scope };
}

// ─── Tüm izin tanımları (seed için) ────────────────────────

export const ALL_PERMISSIONS: { module: string; action: string; description: string }[] = [
  { module: "projeler", action: "read", description: "Projeleri görüntüleme" },
  { module: "projeler", action: "create", description: "Yeni proje oluşturma" },
  { module: "projeler", action: "update", description: "Proje düzenleme" },
  { module: "projeler", action: "delete", description: "Proje silme" },
  { module: "puantaj", action: "read", description: "Puantaj kayıtlarını görüntüleme" },
  { module: "puantaj", action: "write", description: "Puantaj girişi yapma" },
  { module: "puantaj", action: "delete", description: "Puantaj kaydı silme" },
  { module: "hakedis", action: "read", description: "Hakediş verilerini görüntüleme" },
  { module: "hakedis", action: "write", description: "Hakediş verisi girme/düzenleme" },
  { module: "hakedis", action: "delete", description: "Hakediş kaydı silme" },
  { module: "ik", action: "read", description: "İK verilerini görüntüleme" },
  { module: "ik", action: "write", description: "İK verisi girme/düzenleme" },
  { module: "ik", action: "delete", description: "İK kaydı silme" },
  { module: "izin", action: "request", description: "İzin talebi oluşturma" },
  { module: "izin", action: "approve", description: "İzin talebi onaylama" },
  { module: "isg", action: "read", description: "İSG verilerini görüntüleme" },
  { module: "isg", action: "write", description: "İSG verisi girme/düzenleme" },
  { module: "muhasebe", action: "read", description: "Muhasebe verilerini görüntüleme" },
  { module: "muhasebe", action: "write", description: "Muhasebe verisi girme/düzenleme" },
  { module: "duyurular", action: "read", description: "Duyuruları görüntüleme" },
  { module: "duyurular", action: "create", description: "Duyuru oluşturma" },
  { module: "duyurular", action: "delete", description: "Duyuru silme" },
  { module: "indirimler", action: "read", description: "İndirim listesini görüntüleme" },
  { module: "sirketler", action: "read", description: "Şirket bilgilerini görüntüleme" },
  { module: "sirketler", action: "write", description: "Şirket bilgisi düzenleme" },
  { module: "kullanicilar", action: "read", description: "Kullanıcıları görüntüleme" },
  { module: "kullanicilar", action: "write", description: "Kullanıcı oluşturma/düzenleme" },
  { module: "kullanicilar", action: "delete", description: "Kullanıcı silme" },
  { module: "crm", action: "read", description: "CRM verilerini görüntüleme" },
  { module: "crm", action: "write", description: "CRM verisi girme/düzenleme" },
  { module: "taseron", action: "read", description: "Taşeron verilerini görüntüleme" },
  { module: "taseron", action: "write", description: "Taşeron verisi girme/düzenleme" },
  { module: "toplanti", action: "read", description: "Toplantı tutanaklarını görüntüleme" },
  { module: "toplanti", action: "write", description: "Toplantı tutanağı oluşturma/düzenleme" },
  { module: "sunum", action: "read", description: "Sunumları görüntüleme" },
  { module: "sunum", action: "write", description: "Sunum oluşturma/düzenleme" },
  { module: "teklif", action: "read", description: "Teklif/ihale verilerini görüntüleme" },
  { module: "teklif", action: "write", description: "Teklif/ihale verisi girme/düzenleme" },
  { module: "yatirim", action: "read", description: "Yatırım verilerini görüntüleme" },
  { module: "yatirim", action: "write", description: "Yatırım verisi girme/düzenleme" },
  { module: "organizasyon", action: "read", description: "Organizasyon şemasını görüntüleme" },
  { module: "organizasyon", action: "write", description: "Organizasyon düzenleme" },
  { module: "maskot", action: "read", description: "Maskot AI kullanma" },
  { module: "maskot", action: "write", description: "Maskot AI ayarlarını düzenleme" },
  { module: "ayarlar", action: "read", description: "Ayarları görüntüleme" },
  { module: "ayarlar", action: "write", description: "Ayarları düzenleme" },
  { module: "yonetim-paneli", action: "read", description: "Yönetim panelini görüntüleme" },
  { module: "roller", action: "read", description: "Rol & yetki matrisini görüntüleme" },
  { module: "roller", action: "write", description: "Rol & yetki matrisini düzenleme" },
  { module: "dokumanlar", action: "read", description: "Dokümanları görüntüleme" },
  { module: "dokumanlar", action: "write", description: "Doküman oluşturma/düzenleme" },
  { module: "dokumanlar", action: "delete", description: "Doküman silme" },
  { module: "ai-analytics", action: "read", description: "AI Analitik kullanma" },
];

/**
 * Belirli bir rolün tüm izinlerini döndürür (client tarafı sidebar vs. için)
 */
export function getRolePermissions(role: string): Record<string, PermissionScope> {
  if (role === "SUPER_ADMIN") {
    const all: Record<string, PermissionScope> = {};
    ALL_PERMISSIONS.forEach((p) => {
      all[`${p.module}:${p.action}`] = "GLOBAL";
    });
    return all;
  }
  return DEFAULT_ROLE_PERMISSIONS[role] || {};
}

// ─── Sidebar Modül Tanımları ────────────────────────────────

export interface SidebarModulePermission {
  requiredPermission: PermissionCheck;
  label: string;
}

export const SIDEBAR_MODULE_PERMISSIONS: Record<string, SidebarModulePermission> = {
  "yonetim-paneli": { requiredPermission: { module: "yonetim-paneli", action: "read" }, label: "Yönetici Paneli" },
  "projeler": { requiredPermission: { module: "projeler", action: "read" }, label: "Proje Yönetimi" },
  "puantaj": { requiredPermission: { module: "puantaj", action: "read" }, label: "Puantaj" },
  "hakedis": { requiredPermission: { module: "hakedis", action: "read" }, label: "Hakediş" },
  "muhasebe": { requiredPermission: { module: "muhasebe", action: "read" }, label: "Muhasebe" },
  "ik": { requiredPermission: { module: "ik", action: "read" }, label: "İK" },
  "isg": { requiredPermission: { module: "isg", action: "read" }, label: "İSG" },
  "crm": { requiredPermission: { module: "crm", action: "read" }, label: "CRM" },
  "taseron": { requiredPermission: { module: "taseron", action: "read" }, label: "Taşeron" },
  "duyurular": { requiredPermission: { module: "duyurular", action: "read" }, label: "Duyurular" },
  "indirimler": { requiredPermission: { module: "indirimler", action: "read" }, label: "İndirimler" },
  "sirketler": { requiredPermission: { module: "sirketler", action: "read" }, label: "Şirketler" },
  "kullanicilar": { requiredPermission: { module: "kullanicilar", action: "read" }, label: "Kullanıcılar" },
  "organizasyon": { requiredPermission: { module: "organizasyon", action: "read" }, label: "Organizasyon" },
  "toplanti": { requiredPermission: { module: "toplanti", action: "read" }, label: "Toplantı" },
  "sunum": { requiredPermission: { module: "sunum", action: "read" }, label: "Sunum" },
  "teklif": { requiredPermission: { module: "teklif", action: "read" }, label: "Teklif & İhale" },
  "yatirim": { requiredPermission: { module: "yatirim", action: "read" }, label: "Yatırım & GYO" },
  "maskot": { requiredPermission: { module: "maskot", action: "read" }, label: "Maskot AI" },
  "roller": { requiredPermission: { module: "roller", action: "read" }, label: "Rol & Yetki" },
  "dokumanlar": { requiredPermission: { module: "dokumanlar", action: "read" }, label: "Doküman Yönetimi" },
  "ai-analytics": { requiredPermission: { module: "ai-analytics", action: "read" }, label: "AI & Analitik" },
  "ayarlar": { requiredPermission: { module: "ayarlar", action: "read" }, label: "Ayarlar" },
};
