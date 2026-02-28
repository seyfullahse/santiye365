import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const contacts = await prisma.customerContact.findMany({
      where: { customerId: id },
      orderBy: [{ isPrimary: "desc" }, { firstName: "asc" }],
    });
    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Kişiler alınamadı:", error);
    return NextResponse.json({ error: "Kişiler alınamadı" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const contact = await prisma.customerContact.create({
      data: {
        customerId: id,
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title || null,
        phone: body.phone || null,
        email: body.email || null,
        isPrimary: body.isPrimary || false,
        notes: body.notes || null,
      },
    });
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Kişi oluşturulamadı:", error);
    return NextResponse.json({ error: "Kişi oluşturulamadı" }, { status: 500 });
  }
}
