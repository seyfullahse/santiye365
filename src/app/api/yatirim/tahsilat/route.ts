import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Tahsilat planı (ödeme kayıtları)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const saleId = searchParams.get("saleId");
    const projectId = searchParams.get("projectId");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (saleId) where.saleId = saleId;
    if (projectId) where.sale = { unit: { projectId } };
    if (status) where.status = status;

    const payments = await prisma.paymentPlan.findMany({
      where,
      include: {
        sale: {
          include: {
            unit: {
              include: {
                project: { select: { id: true, name: true } },
              },
            },
            customer: true,
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Tahsilat getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni ödeme kaydı
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const payment = await prisma.paymentPlan.create({
      data: {
        saleId: body.saleId,
        type: body.type || "TAKSIT",
        installmentNo: body.installmentNo ? parseInt(body.installmentNo) : 1,
        dueDate: new Date(body.dueDate),
        amount: parseFloat(body.amount),
        paidAmount: body.paidAmount ? parseFloat(body.paidAmount) : 0,
        paidDate: body.paidDate ? new Date(body.paidDate) : null,
        status: body.status || "BEKLENIYOR",
        notes: body.notes,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Tahsilat oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
