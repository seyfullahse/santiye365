import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const team = await prisma.team.update({
      where: { id },
      data: {
        name: body.name,
        companyId: body.companyId,
        disciplineId: body.disciplineId,
        sortOrder: body.sortOrder ?? undefined,
      },
    });
    return NextResponse.json(team);
  } catch (error) {
    console.error("Ekip güncellenemedi:", error);
    return NextResponse.json({ error: "Ekip güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const workforceCount = await prisma.workforceDaily.count({ where: { teamId: id } });
    if (workforceCount > 0) {
      return NextResponse.json(
        { error: `Bu ekibe bağlı ${workforceCount} personel kaydı bulunmaktadır. Önce personel kayıtlarını silmelisiniz.` },
        { status: 400 }
      );
    }

    await prisma.team.delete({ where: { id } });
    return NextResponse.json({ message: "Ekip silindi" });
  } catch (error) {
    console.error("Ekip silinemedi:", error);
    return NextResponse.json({ error: "Ekip silinemedi" }, { status: 500 });
  }
}
