import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const segment = searchParams.get("segment") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { city: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && status !== "all") where.status = status;
    if (segment && segment !== "all") where.segment = segment;

    const customers = await prisma.customer.findMany({
      where,
      include: {
        _count: {
          select: {
            contacts: true,
            opportunities: true,
            projects: true,
            communications: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error("Müşteriler alınamadı:", error);
    return NextResponse.json({ error: "Müşteriler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        type: body.type || "COMPANY",
        segment: body.segment || "PRIVATE",
        taxNo: body.taxNo?.trim() || null,
        taxOffice: body.taxOffice?.trim() || null,
        address: body.address?.trim() || null,
        city: body.city?.trim() || null,
        phone: body.phone?.trim() || null,
        email: body.email?.trim() || null,
        website: body.website?.trim() || null,
        notes: body.notes?.trim() || null,
        status: body.status || "ACTIVE",
      },
    });
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Müşteri oluşturulamadı:", error);
    const message = error instanceof Error ? error.message : "Müşteri oluşturulamadı";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
