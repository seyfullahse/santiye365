import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const zoneId = req.nextUrl.searchParams.get("zoneId");
  const floorId = req.nextUrl.searchParams.get("floorId");
  try {
    const items = await prisma.materialItem.findMany({
      where: {
        ...(projectId ? { projectId } : {}),
        ...(zoneId ? { zoneId } : {}),
        ...(floorId ? { floorId } : {}),
      },
      include: {
        project: { select: { name: true } },
        zone: { select: { name: true } },
        floor: { select: { name: true } },
      },
      orderBy: [{ orderPriority: "asc" }, { pozNo: "asc" }],
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error("Malzemeler alınamadı:", error);
    return NextResponse.json({ error: "Malzemeler alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Malzeme POST body:", JSON.stringify(body, null, 2));
    
    if (!body.projectId || !body.zoneId || !body.floorId) {
      return NextResponse.json(
        { error: "Proje, Mahal ve Kat zorunludur" },
        { status: 400 }
      );
    }

    const item = await prisma.materialItem.create({
      data: {
        projectId: body.projectId,
        zoneId: body.zoneId,
        floorId: body.floorId,
        pozNo: String(body.pozNo || ""),
        orderPriority: Number(body.orderPriority) || 0,
        scope: String(body.scope || ""),
        unit: String(body.unit || ""),
        quantity: Number(body.quantity) || 0,
        designApproval: body.designApproval || "BEKLEMEDE",
        ownerApproval: body.ownerApproval || "BEKLEMEDE",
        approvalNote: body.approvalNote || null,
        quotationFirms: body.quotationFirms || null,
        orderDecision: body.orderDecision || null,
        supplierName: body.supplierName || null,
        supplierContact: body.supplierContact || null,
        orderStatus: body.orderStatus || "BEKLEMEDE",
        deliveryStatus: body.deliveryStatus || "BEKLEMEDE",
        responsiblePerson: body.responsiblePerson || null,
        note: body.note || null,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error("Malzeme oluşturulamadı:", error);
    const message = error instanceof Error ? error.message : "Bilinmeyen hata";
    return NextResponse.json({ error: "Malzeme oluşturulamadı", detail: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) {
      return NextResponse.json({ error: "Silinecek kayıt yok" }, { status: 400 });
    }
    const result = await prisma.materialItem.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Malzemeler toplu silinemedi:", error);
    return NextResponse.json({ error: "Malzemeler toplu silinemedi" }, { status: 500 });
  }
}
