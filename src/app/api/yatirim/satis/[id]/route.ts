import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// DELETE - Satış kaydı sil (birim durumunu BOS'a döndür)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      const sale = await tx.unitSale.findUnique({ where: { id } });
      if (sale) {
        await tx.projectUnit.update({
          where: { id: sale.unitId },
          data: { status: "BOS" },
        });
      }
      await tx.unitSale.delete({ where: { id } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Satış silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
