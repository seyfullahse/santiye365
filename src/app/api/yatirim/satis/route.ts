import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Satışları listele (proje bazlı opsiyonel)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");

    const where = projectId
      ? { unit: { projectId } }
      : {};

    const sales = await prisma.unitSale.findMany({
      where,
      include: {
        unit: {
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
        customer: true,
        payments: {
          orderBy: { installmentNo: "asc" },
        },
      },
      orderBy: { saleDate: "desc" },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("Satış getirme hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}

// POST - Yeni satış kaydı
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Transaction: birim durumunu güncelle + satış kaydı oluştur
    const result = await prisma.$transaction(async (tx) => {
      // Birim durumunu SATILDI yap
      await tx.projectUnit.update({
        where: { id: body.unitId },
        data: { status: "SATILDI" },
      });

      // Satış kaydı oluştur
      const sale = await tx.unitSale.create({
        data: {
          unitId: body.unitId,
          customerId: body.customerId || null,
          buyerName: body.buyerName,
          buyerPhone: body.buyerPhone,
          buyerEmail: body.buyerEmail,
          salePrice: parseFloat(body.salePrice),
          saleDate: new Date(body.saleDate),
          contractNo: body.contractNo,
          notes: body.notes,
        },
      });

      // Ödeme planı oluştur (payments array gönderildiyse)
      if (body.payments && Array.isArray(body.payments)) {
        for (const payment of body.payments) {
          await tx.paymentPlan.create({
            data: {
              saleId: sale.id,
              type: payment.type || "TAKSIT",
              installmentNo: payment.installmentNo || 1,
              dueDate: new Date(payment.dueDate),
              amount: parseFloat(payment.amount),
              status: "BEKLENIYOR",
            },
          });
        }
      }

      return sale;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Satış oluşturma hatası:", error);
    return NextResponse.json({ error: "Sunucu hatası" }, { status: 500 });
  }
}
