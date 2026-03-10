import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Poz kalemi güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code, description, unit, laborCost, materialCost, equipmentCost, source, year, notes, isActive } = body;

    const labor = laborCost !== undefined ? parseFloat(laborCost) || 0 : undefined;
    const material = materialCost !== undefined ? parseFloat(materialCost) || 0 : undefined;
    const equipment = equipmentCost !== undefined ? parseFloat(equipmentCost) || 0 : undefined;

    // Get current for unitPrice calc if partial update
    let unitPrice: number | undefined;
    if (labor !== undefined || material !== undefined || equipment !== undefined) {
      const current = await prisma.pozItem.findUnique({ where: { id } });
      if (current) {
        const l = labor ?? current.laborCost;
        const m = material ?? current.materialCost;
        const e = equipment ?? current.equipmentCost;
        unitPrice = l + m + e;
      }
    }

    const pozItem = await prisma.pozItem.update({
      where: { id },
      data: {
        ...(code !== undefined && { code: code.trim() }),
        ...(description !== undefined && { description: description.trim() }),
        ...(unit !== undefined && { unit: unit.trim() }),
        ...(labor !== undefined && { laborCost: labor }),
        ...(material !== undefined && { materialCost: material }),
        ...(equipment !== undefined && { equipmentCost: equipment }),
        ...(unitPrice !== undefined && { unitPrice }),
        ...(source !== undefined && { source }),
        ...(year !== undefined && { year }),
        ...(notes !== undefined && { notes: notes || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });
    return NextResponse.json(pozItem);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Güncellenemedi" }, { status: 500 });
  }
}

// DELETE
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.pozItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: "Poz kalemi silinemedi" }, { status: 500 });
  }
}
