import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
    const body = await req.json();
    const contact = await prisma.customerContact.update({
      where: { id: contactId },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        title: body.title,
        phone: body.phone,
        email: body.email,
        isPrimary: body.isPrimary,
        notes: body.notes,
      },
    });
    return NextResponse.json(contact);
  } catch (error) {
    console.error("Kişi güncellenemedi:", error);
    return NextResponse.json({ error: "Kişi güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; contactId: string }> }
) {
  try {
    const { contactId } = await params;
    await prisma.customerContact.delete({ where: { id: contactId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Kişi silinemedi:", error);
    return NextResponse.json({ error: "Kişi silinemedi" }, { status: 500 });
  }
}
