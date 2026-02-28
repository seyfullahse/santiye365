import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        contacts: { orderBy: { isPrimary: "desc" } },
        opportunities: { orderBy: { createdAt: "desc" } },
        communications: { orderBy: { contactDate: "desc" }, take: 10 },
        projects: { select: { id: true, name: true, status: true } },
        _count: {
          select: {
            contacts: true,
            opportunities: true,
            projects: true,
            communications: true,
          },
        },
      },
    });
    if (!customer) {
      return NextResponse.json({ error: "Müşteri bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Müşteri alınamadı:", error);
    return NextResponse.json({ error: "Müşteri alınamadı" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: body.name,
        type: body.type,
        segment: body.segment,
        taxNo: body.taxNo,
        taxOffice: body.taxOffice,
        address: body.address,
        city: body.city,
        phone: body.phone,
        email: body.email,
        website: body.website,
        notes: body.notes,
        status: body.status,
      },
    });
    return NextResponse.json(customer);
  } catch (error) {
    console.error("Müşteri güncellenemedi:", error);
    return NextResponse.json({ error: "Müşteri güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.customer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Müşteri silinemedi:", error);
    return NextResponse.json({ error: "Müşteri silinemedi" }, { status: 500 });
  }
}
