-- ═══════════════════════════════════════════════════════════
-- Şantiye360 — Eksik Tablo Migration (Rol & Yetki + Workflow & Bildirim)
-- Tarih: 2025-07-11
-- ═══════════════════════════════════════════════════════════

-- ── 1. ENUM TİPLERİ ──────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE "PermissionScope" AS ENUM ('NONE', 'SELF', 'PROJECT', 'COMPANY', 'GLOBAL');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'APPROVE', 'REJECT', 'EXPORT', 'PERMISSION_CHANGE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApproverType" AS ENUM ('ROLE', 'USER', 'MANAGER', 'DEPARTMENT');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "WorkflowApprovalStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'ESCALATED', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('APPROVAL_PENDING', 'APPROVAL_APPROVED', 'APPROVAL_REJECTED', 'APPROVAL_ESCALATED', 'LEAVE_REQUEST', 'ANNOUNCEMENT', 'PROJECT_ASSIGNMENT', 'SLA_WARNING', 'SYSTEM', 'REMINDER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "CollarType" AS ENUM ('WHITE', 'BLUE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 2. PERMISSIONS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "permissions" (
  "id" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "description" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "permissions_module_action_key" ON "permissions"("module", "action");

-- ── 3. ROLE_PERMISSIONS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS "role_permissions" (
  "id" TEXT NOT NULL,
  "role" "UserRole" NOT NULL,
  "permission_id" TEXT NOT NULL,
  "scope" "PermissionScope" NOT NULL DEFAULT 'NONE',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "role_permissions_role_permission_id_key" ON "role_permissions"("role", "permission_id");

DO $$ BEGIN
  ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 4. USER_PERMISSIONS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS "user_permissions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "permission_id" TEXT NOT NULL,
  "scope" "PermissionScope" NOT NULL DEFAULT 'NONE',
  "project_id" TEXT,
  "company_id" TEXT,
  "granted" BOOLEAN NOT NULL DEFAULT true,
  "granted_by" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMP(3),
  CONSTRAINT "user_permissions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_permissions_user_id_permission_id_project_id_company_id_key"
  ON "user_permissions"("user_id", "permission_id", "project_id", "company_id");

DO $$ BEGIN
  ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_permission_id_fkey"
    FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "user_permissions" ADD CONSTRAINT "user_permissions_company_id_fkey"
    FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 5. AUDIT_LOGS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "audit_logs" (
  "id" TEXT NOT NULL,
  "user_id" TEXT,
  "action" "AuditAction" NOT NULL,
  "module" TEXT NOT NULL,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "old_data" JSONB,
  "new_data" JSONB,
  "description" TEXT,
  "ip_address" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "audit_logs_user_id_idx" ON "audit_logs"("user_id");
CREATE INDEX IF NOT EXISTS "audit_logs_module_idx" ON "audit_logs"("module");
CREATE INDEX IF NOT EXISTS "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "audit_logs"("created_at");

DO $$ BEGIN
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 6. APPROVAL_CHAINS ───────────────────────────────────

CREATE TABLE IF NOT EXISTS "approval_chains" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "sla_hours" INTEGER NOT NULL DEFAULT 48,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_chains_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "approval_chains_module_key" ON "approval_chains"("module");

-- ── 7. APPROVAL_STEPS ────────────────────────────────────

CREATE TABLE IF NOT EXISTS "approval_steps" (
  "id" TEXT NOT NULL,
  "chain_id" TEXT NOT NULL,
  "step_order" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "approver_type" "ApproverType" NOT NULL,
  "approver_role" "UserRole",
  "approver_id" TEXT,
  "auto_assign" BOOLEAN NOT NULL DEFAULT false,
  "sla_hours" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_steps_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "approval_steps_chain_id_step_order_key" ON "approval_steps"("chain_id", "step_order");

DO $$ BEGIN
  ALTER TABLE "approval_steps" ADD CONSTRAINT "approval_steps_chain_id_fkey"
    FOREIGN KEY ("chain_id") REFERENCES "approval_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 8. APPROVAL_REQUESTS ─────────────────────────────────

CREATE TABLE IF NOT EXISTS "approval_requests" (
  "id" TEXT NOT NULL,
  "chain_id" TEXT NOT NULL,
  "requester_id" TEXT NOT NULL,
  "entity_type" TEXT NOT NULL,
  "entity_id" TEXT NOT NULL,
  "current_step" INTEGER NOT NULL DEFAULT 1,
  "status" "WorkflowApprovalStatus" NOT NULL DEFAULT 'PENDING',
  "assigned_to" TEXT,
  "action_note" TEXT,
  "action_at" TIMESTAMP(3),
  "action_by" TEXT,
  "sla_deadline" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "approval_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "approval_requests_requester_id_idx" ON "approval_requests"("requester_id");
CREATE INDEX IF NOT EXISTS "approval_requests_assigned_to_idx" ON "approval_requests"("assigned_to");
CREATE INDEX IF NOT EXISTS "approval_requests_status_idx" ON "approval_requests"("status");
CREATE INDEX IF NOT EXISTS "approval_requests_entity_type_entity_id_idx" ON "approval_requests"("entity_type", "entity_id");

DO $$ BEGIN
  ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_chain_id_fkey"
    FOREIGN KEY ("chain_id") REFERENCES "approval_chains"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_id_fkey"
    FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_action_by_fkey"
    FOREIGN KEY ("action_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 9. NOTIFICATIONS ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "link" TEXT,
  "entity_type" TEXT,
  "entity_id" TEXT,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "read_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX IF NOT EXISTS "notifications_created_at_idx" ON "notifications"("created_at");

DO $$ BEGIN
  ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 10. NOTIFICATION_PREFERENCES ──────────────────────────

CREATE TABLE IF NOT EXISTS "notification_preferences" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "notification_type" "NotificationType" NOT NULL,
  "in_app" BOOLEAN NOT NULL DEFAULT true,
  "email" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_preferences_user_id_notification_type_key"
  ON "notification_preferences"("user_id", "notification_type");

DO $$ BEGIN
  ALTER TABLE "notification_preferences" ADD CONSTRAINT "notification_preferences_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 11. WORKERS — employee_id KOLONU ──────────────────────

DO $$ BEGIN
  ALTER TABLE "workers" ADD COLUMN "employee_id" TEXT UNIQUE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "workers" ADD CONSTRAINT "workers_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── 12. WORKERS — collar_type KOLONU ──────────────────────

DO $$ BEGIN
  ALTER TABLE "workers" ADD COLUMN "collar_type" "CollarType" NOT NULL DEFAULT 'BLUE';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ── 13. USERS — employee_id KOLONU ────────────────────────

DO $$ BEGIN
  ALTER TABLE "users" ADD COLUMN "employee_id" TEXT UNIQUE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "users" ADD CONSTRAINT "users_employee_id_fkey"
    FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ═══════════════════════════════════════════════════════════
-- TAMAMLANDI — 9 yeni tablo, 6 enum, 3 kolon eklendi
-- ═══════════════════════════════════════════════════════════
