import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { gallerySchema } from "@/lib/schemas";

// GET: Retorna os itens da galeria
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const category = searchParams.get("category");

    const where: any = {};
    if (activeOnly) where.active = true;
    if (category) where.category = category;

    const items = await prisma.galleryItem.findMany({
      where,
      orderBy: { order: "asc" },
    });

    const response = NextResponse.json(items);
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
    return response;
  } catch (error: any) {
    console.error("Erro ao buscar itens da galeria:", error);
    return NextResponse.json(
      { error: "Erro ao buscar itens da galeria." },
      { status: 500 }
    );
  }
}

// POST: Cria um novo item na galeria (Protegido)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = gallerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const item = await prisma.galleryItem.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar item na galeria:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza um item na galeria (Protegido)
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
        { error: "ID do item é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = gallerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const item = await prisma.galleryItem.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, item });
  } catch (error: any) {
    console.error("Erro ao atualizar item na galeria:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou item não encontrado." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui um item da galeria (Protegido)
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
        { error: "ID do item é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.galleryItem.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Item excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir item da galeria:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou item não encontrado." },
      { status: 500 }
    );
  }
}
