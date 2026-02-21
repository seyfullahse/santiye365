import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const company = await prisma.company.update({
      where: { id },
      data: { name: body.name, type: body.type, sortOrder: body.sortOrder ?? undefined },
    });
    return NextResponse.json(company);
  } catch (error) {
    console.error("Şirket güncellenemedi:", error);
    return NextResponse.json({ error: "Şirket güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const teamCount = await prisma.team.count({ where: { companyId: id } });
    if (teamCount > 0) {
      return NextResponse.json(
        { error: `Bu şirkete bağlı ${teamCount} ekip bulunmaktadır. Önce ekipleri silmelisiniz.` },
        { status: 400 }
      );
    }

    await prisma.company.delete({ where: { id } });
    return NextResponse.json({ message: "Şirket silindi" });
  } catch (error) {
    console.error("Şirket silinemedi:", error);
    return NextResponse.json({ error: "Şirket silinemedi" }, { status: 500 });
  }
}
