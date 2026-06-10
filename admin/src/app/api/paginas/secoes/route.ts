import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { pageSectionSchema } from "@/lib/schemas";

// POST: Cria uma nova seção em uma página (Protegido)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get("pageId");

    if (!pageId) {
      return NextResponse.json(
        { error: "O ID da página é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = pageSectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const section = await prisma.pageSection.create({
      data: {
        pageId,
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl || null,
        videoUrl: parsed.data.videoUrl || null,
        bgType: parsed.data.bgType,
        order: parsed.data.order,
      },
    });

    return NextResponse.json({ success: true, section }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar seção de página:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza uma seção de página (Protegido)
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
        { error: "ID da seção é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = pageSectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const section = await prisma.pageSection.update({
      where: { id },
      data: {
        title: parsed.data.title,
        subtitle: parsed.data.subtitle,
        content: parsed.data.content,
        imageUrl: parsed.data.imageUrl || null,
        videoUrl: parsed.data.videoUrl || null,
        bgType: parsed.data.bgType,
        order: parsed.data.order,
      },
    });

    return NextResponse.json({ success: true, section });
  } catch (error: any) {
    console.error("Erro ao atualizar seção de página:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou seção não encontrada." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui uma seção de página (Protegido)
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
        { error: "ID da seção é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.pageSection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Seção excluída com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir seção de página:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou seção não encontrada." },
      { status: 500 }
    );
  }
}
