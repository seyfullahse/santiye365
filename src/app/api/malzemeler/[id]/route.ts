import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const item = await prisma.materialItem.findUnique({
      where: { id },
      include: {
        project: { select: { name: true } },
        zone: { select: { name: true } },
        floor: { select: { name: true } },
      },
    });
    if (!item) {
      return NextResponse.json({ error: "Malzeme bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error("Malzeme alınamadı:", error);
    return NextResponse.json({ error: "Malzeme alınamadı" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const item = await prisma.materialItem.update({
      where: { id },
      data: {
        projectId: body.projectId,
        zoneId: body.zoneId,
        floorId: body.floorId,
        pozNo: body.pozNo,
        orderPriority: body.orderPriority,
        scope: body.scope,
        unit: body.unit,
        quantity: body.quantity,
        designApproval: body.designApproval,
        ownerApproval: body.ownerApproval,
        approvalNote: body.approvalNote || null,
        quotationFirms: body.quotationFirms || null,
        orderDecision: body.orderDecision || null,
        supplierName: body.supplierName || null,
        supplierContact: body.supplierContact || null,
        orderStatus: body.orderStatus,
        deliveryStatus: body.deliveryStatus,
        responsiblePerson: body.responsiblePerson || null,
        note: body.note || null,
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error("Malzeme güncellenemedi:", error);
    return NextResponse.json({ error: "Malzeme güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.materialItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Malzeme silinemedi:", error);
    return NextResponse.json({ error: "Malzeme silinemedi" }, { status: 500 });
  }
}
