import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        zones: true,
        _count: { select: { zones: true, activities: true, risks: true } },
      },
    });
    if (!project) {
      return NextResponse.json({ error: "Proje bulunamadı" }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (error) {
    console.error("Proje alınamadı:", error);
    return NextResponse.json({ error: "Proje alınamadı" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const project = await prisma.project.update({
      where: { id },
      data: {
        name: body.name,
        client: body.client || null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status,
      },
    });
    return NextResponse.json(project);
  } catch (error) {
    console.error("Proje güncellenemedi:", error);
    return NextResponse.json({ error: "Proje güncellenemedi" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const childCount = await prisma.zone.count({ where: { projectId: id } });
    if (childCount > 0) {
      return NextResponse.json(
        { error: `Bu projeye bağlı ${childCount} mahal bulunmaktadır. Önce mahalleri silmelisiniz.` },
        { status: 400 }
      );
    }

    await prisma.project.delete({ where: { id } });
    return NextResponse.json({ message: "Proje silindi" });
  } catch (error) {
    console.error("Proje silinemedi:", error);
    return NextResponse.json({ error: "Proje silinemedi" }, { status: 500 });
  }
}
