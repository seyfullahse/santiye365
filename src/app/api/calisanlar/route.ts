import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const teamId = req.nextUrl.searchParams.get("teamId");
  const companyId = req.nextUrl.searchParams.get("companyId");

  try {
    const workers = await prisma.worker.findMany({
      where: {
        ...(teamId ? { teamId } : {}),
        ...(companyId ? { team: { companyId } } : {}),
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, sortOrder: true } },
            discipline: { select: { name: true } },
          },
        },
        employee: {
          select: {
            id: true,
            user: { select: { id: true, email: true } },
          },
        },
      },
      orderBy: [
        { team: { company: { sortOrder: "asc" } } },
        { team: { sortOrder: "asc" } },
        { sortOrder: "asc" },
        { lastName: "asc" },
      ],
    });
    return NextResponse.json(workers);
  } catch (error) {
    console.error("Çalışan verileri alınamadı:", error);
    return NextResponse.json(
      { error: "Çalışan verileri alınamadı" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const worker = await prisma.worker.create({
      data: {
        teamId: body.teamId,
        firstName: body.firstName,
        lastName: body.lastName,
        role: body.role,
        sortOrder: body.sortOrder ?? 0,
      },
      include: {
        team: {
          include: {
            company: { select: { id: true, name: true, sortOrder: true } },
            discipline: { select: { name: true } },
          },
        },
      },
    });
    return NextResponse.json(worker, { status: 201 });
  } catch (error) {
    console.error("Çalışan kaydı oluşturulamadı:", error);
    return NextResponse.json(
      { error: "Çalışan kaydı oluşturulamadı" },
      { status: 500 }
    );
  }
}
