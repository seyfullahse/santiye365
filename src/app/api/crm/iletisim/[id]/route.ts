import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.communicationLog.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("İletişim logu silinemedi:", error);
    return NextResponse.json({ error: "İletişim logu silinemedi" }, { status: 500 });
  }
}
