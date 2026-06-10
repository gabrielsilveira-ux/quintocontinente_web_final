import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { bannerSchema } from "@/lib/schemas";

// GET: Retorna os banners cadastrados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const banners = await prisma.banner.findMany({
      where: activeOnly ? { active: true } : undefined,
      orderBy: { order: "asc" },
    });

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error("Erro ao buscar banners:", error);
    return NextResponse.json(
      { error: "Erro ao buscar os banners." },
      { status: 500 }
    );
  }
}

// POST: Cria um novo banner (Protegido)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bannerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, banner }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar banner:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza um banner existente (Protegido)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do banner é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = bannerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, banner });
  } catch (error: any) {
    console.error("Erro ao atualizar banner:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou banner não encontrado." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui um banner (Protegido)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do banner é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.banner.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Banner excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir banner:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou banner não encontrado." },
      { status: 500 }
    );
  }
}
