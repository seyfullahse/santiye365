import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const companies = await prisma.company.findMany({
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
