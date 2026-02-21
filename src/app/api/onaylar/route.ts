import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");
  const status = req.nextUrl.searchParams.get("status");
  try {
    const approvals = await prisma.approval.findMany({
      where: {
        ...(status ? { status: status as "WAITING" | "RESOLVED" } : {}),
        ...(projectId
          ? { activity: { projectId } }
          : {}),
      },
      include: {
        activity: {
          select: { name: true, project: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(approvals);
  } catch (error) {
    console.error("Onaylar alınamadı:", error);
    return NextResponse.json({ error: "Onaylar alınamadı" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const approval = await prisma.approval.create({
      data: {
        activityId: body.activityId,
        title: body.title,
        waitingOn: body.waitingOn || null,
        waitingDays: body.waitingDays || 0,
        impactType: body.impactType || "DURATION",
        note: body.note || null,
        status: "WAITING",
      },
    });
    return NextResponse.json(approval, { status: 201 });
  } catch (error) {
    console.error("Onay oluşturulamadı:", error);
    return NextResponse.json({ error: "Onay oluşturulamadı" }, { status: 500 });
  }
}
