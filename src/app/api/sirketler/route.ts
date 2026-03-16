import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const includeMain = req.nextUrl.searchParams.get("includeMain") === "true";
    const companies = await prisma.company.findMany({
      where: includeMain ? {} : { type: { not: "MAIN" } },
      include: { _count: { select: { teams: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    return NextResponse.json(companies);
  } catch (error) {
    console.error("Şirketler alınamadı:", error);
    return NextResponse.json({ error: "Şirketler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // MAIN firma bu endpoint'ten oluşturulamaz — Organizasyon/Profil'den yönetilir
    if (body.type === "MAIN") {
      return NextResponse.json({ error: "Ana firma bu sayfadan oluşturulamaz. Organizasyon > Profil sayfasını kullanın." }, { status: 403 });
    }
    
    const company = await prisma.company.create({
      data: {
        name: body.name,
        type: body.type || "SUBCONTRACTOR",
        sortOrder: body.sortOrder ?? 0,
      },
    });
    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error("Şirket oluşturulamadı:", error);
    return NextResponse.json({ error: "Şirket oluşturulamadı" }, { status: 500 });
  }
}
