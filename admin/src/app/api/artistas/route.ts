import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { artistSchema } from "@/lib/schemas";

// GET: Retorna os artistas cadastrados
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";
    const featuredOnly = searchParams.get("featured") === "true";
    const slug = searchParams.get("slug");

    if (slug) {
      const artist = await prisma.artist.findUnique({
        where: { slug },
      });
      if (!artist) {
        return NextResponse.json({ error: "Artista não encontrado." }, { status: 404 });
      }
      return NextResponse.json(artist);
    }

    const where: any = {};
    if (activeOnly) where.active = true;
    if (featuredOnly) where.featured = true;

    const artists = await prisma.artist.findMany({
      where,
      orderBy: { order: "asc" },
    });

    return NextResponse.json(artists);
  } catch (error: any) {
    console.error("Erro ao buscar artistas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar os artistas." },
      { status: 500 }
    );
  }
}

// POST: Cria um novo artista (Protegido)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = artistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const artist = await prisma.artist.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, artist }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar artista:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza um artista existente (Protegido)
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
        { error: "ID do artista é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = artistSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const artist = await prisma.artist.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, artist });
  } catch (error: any) {
    console.error("Erro ao atualizar artista:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou artista não encontrado." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui um artista (Protegido)
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
        { error: "ID do artista é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.artist.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Artista excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir artista:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou artista não encontrado." },
      { status: 500 }
    );
  }
}
