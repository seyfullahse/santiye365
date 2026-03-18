/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import bcrypt from "bcryptjs";

// Türkçe karakterleri normalize et (email için)
function normalizeForEmail(str: string): string {
  return str
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9.]/g, "")
    .trim();
}

interface EmployeeInput {
  employeeId: string;
  email?: string;
  password?: string;
  role?: string;
}

/**
 * POST - İK personelinden kullanıcı hesabı oluştur (tekli veya toplu)
 * Body: {
 *   employees: EmployeeInput[]  — her biri için employeeId zorunlu
 *   defaultPassword?: string — varsayılan şifre
 *   defaultRole?: string — varsayılan rol
 *   emailDomain?: string — e-posta domain'i (varsayılan: santiye360.com)
 * }
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.user.role)) {
    return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
  }

  const body = await req.json();
  const {
    employees: employeeInputs,
    defaultPassword = "123456",
    defaultRole = "USER",
    emailDomain = "santiye360.com",
  } = body as {
    employees: EmployeeInput[];
    defaultPassword?: string;
    defaultRole?: string;
    emailDomain?: string;
  };

  if (!employeeInputs || !Array.isArray(employeeInputs) || employeeInputs.length === 0) {
    return NextResponse.json({ error: "En az bir personel seçmelisiniz" }, { status: 400 });
  }

  const results: {
    employeeId: string;
    employeeName: string;
    success: boolean;
    userId?: string;
    email?: string;
    error?: string;
  }[] = [];

  // Tüm employee verilerini tek seferde çek
  const employeeIds = employeeInputs.map((e) => e.employeeId);
  const dbEmployees = await prisma.employee.findMany({
    where: { id: { in: employeeIds } },
    include: {
      user: { select: { id: true, email: true } },
      department: { select: { name: true } },
      position: { select: { name: true } },
    },
  });

  const employeeMap = new Map(dbEmployees.map((e) => [e.id, e]));

  // Mevcut e-postaları çek (çakışma kontrolü)
  const existingEmails = new Set(
    (await (prisma.user as any).findMany({ select: { email: true } })).map(
      (u: any) => u.email.toLowerCase()
    )
  );

  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  for (const input of employeeInputs) {
    const employee = employeeMap.get(input.employeeId);
    if (!employee) {
      results.push({
        employeeId: input.employeeId,
        employeeName: "Bilinmiyor",
        success: false,
        error: "Personel bulunamadı",
      });
      continue;
    }

    const employeeName = `${employee.firstName} ${employee.lastName}`;

    // Zaten user hesabı var mı?
    if (employee.user) {
      results.push({
        employeeId: input.employeeId,
        employeeName,
        success: false,
        error: `Zaten kullanıcı hesabı var (${employee.user.email})`,
      });
      continue;
    }

    // E-posta oluştur
    let email = input.email;
    if (!email) {
      const base = `${normalizeForEmail(employee.firstName)}.${normalizeForEmail(employee.lastName)}`;
      email = `${base}@${emailDomain}`;

      // Çakışma varsa numara ekle
      let counter = 1;
      while (existingEmails.has(email.toLowerCase())) {
        email = `${base}${counter}@${emailDomain}`;
        counter++;
      }
    }

    // E-posta zaten varsa atla
    if (existingEmails.has(email.toLowerCase())) {
      results.push({
        employeeId: input.employeeId,
        employeeName,
        success: false,
        error: `E-posta zaten kullanımda: ${email}`,
      });
      continue;
    }

    // Şifre — kişiye özel varsa hash'le, yoksa ortak hash'i kullan
    const pwd = input.password
      ? await bcrypt.hash(input.password, 10)
      : hashedPassword;

    try {
      const user = await (prisma.user as any).create({
        data: {
          name: employeeName,
          email: email.toLowerCase(),
          password: pwd,
          role: input.role || defaultRole,
          phone: employee.phone || null,
          employeeId: employee.id,
        },
        select: { id: true, email: true },
      });

      existingEmails.add(email.toLowerCase());
      results.push({
        employeeId: input.employeeId,
        employeeName,
        success: true,
        userId: user.id,
        email: user.email,
      });
    } catch (err: any) {
      results.push({
        employeeId: input.employeeId,
        employeeName,
        success: false,
        error: err?.message || "Kullanıcı oluşturulamadı",
      });
    }
  }

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    results,
    summary: {
      total: results.length,
      success: successCount,
      fail: failCount,
    },
  });
}
