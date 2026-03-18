import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    // Ana tanımı güncelle
    const updated = await prisma.trainingDefinition.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description || null,
        durationHours: body.durationHours ? parseFloat(body.durationHours) : 0,
        isMandatory: body.isMandatory ?? false,
        validityMonths: body.validityMonths ? parseInt(body.validityMonths) : null,
        category: body.category || "ISG",
      },
    });

    // Requirements güncelle (sil-yeniden oluştur)
    if (body.requirements !== undefined) {
      await prisma.trainingRequirement.deleteMany({ where: { trainingDefinitionId: id } });
      if (body.requirements?.length > 0) {
        await prisma.trainingRequirement.createMany({
          data: body.requirements.map((r: { targetType: string; targetValue?: string }) => ({
            trainingDefinitionId: id,
            targetType: r.targetType,
            targetValue: r.targetValue || null,
          })),
        });
      }
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT error:", error);
    return NextResponse.json({ error: "Güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // İlişkili eğitim kayıtları varsa uyar
    const count = await prisma.employeeTraining.count({ where: { trainingId: id } });
    if (count > 0) {
      return NextResponse.json(
        { error: `Bu tanıma ait ${count} eğitim kaydı var. Önce kayıtları silin.` },
        { status: 400 }
      );
    }
    await prisma.trainingDefinition.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json({ error: "Silinemedi" }, { status: 500 });
  }
}
