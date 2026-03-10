import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Ödeme güncelle (tahsilat yap)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const payment = await prisma.paymentPlan.update({
      where: { id },
      data: {
        type: body.type,
        installmentNo: body.installmentNo !== undefined ? parseInt(body.installmentNo) : undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
        paidAmount: body.paidAmount !== undefined ? parseFloat(body.paidAmount) : undefined,
        paidDate: body.paidDate ? new Date(body.paidDate) : undefined,
        status: body.status,
        notes: body.notes,
      },
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Tahsilat güncelleme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// DELETE - Ödeme sil
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.paymentPlan.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Tahsilat silme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
