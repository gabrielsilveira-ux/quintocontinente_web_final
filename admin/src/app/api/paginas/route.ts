import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { pageSchema } from "@/lib/schemas";

// GET: Retorna todas as páginas ou uma página específica pelo ?slug=sobre
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const activeOnly = searchParams.get("active") === "true";

    if (slug) {
      const page = await prisma.page.findUnique({
        where: { slug },
        include: {
          sections: {
            orderBy: { order: "asc" },
          },
        },
      });

      if (!page) {
        return NextResponse.json({ error: "Página não encontrada." }, { status: 404 });
      }

      if (activeOnly && !page.active) {
        return NextResponse.json({ error: "Página inativa." }, { status: 403 });
      }

      const response = NextResponse.json(page);
      response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
      return response;
    }

    const where: any = {};
    if (activeOnly) where.active = true;

    const pages = await prisma.page.findMany({
      where,
      orderBy: { title: "asc" },
    });

    const response = NextResponse.json(pages);
    response.headers.set("Cache-Control", "public, s-maxage=30, stale-while-revalidate=300");
    return response;
  } catch (error: any) {
    console.error("Erro ao buscar páginas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar as páginas." },
      { status: 500 }
    );
  }
}

// POST: Cria uma nova página (Protegido)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const body = await request.json();
    const parsed = pageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Verifica se já existe uma página com o mesmo slug
    const existing = await prisma.page.findUnique({
      where: { slug: parsed.data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe uma página cadastrada com este slug." },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: parsed.data,
    });

    return NextResponse.json({ success: true, page }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar página:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza uma página existente (Protegido)
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
        { error: "ID da página é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = pageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    // Verifica unicidade do slug se foi alterado
    const existing = await prisma.page.findFirst({
      where: {
        slug: parsed.data.slug,
        NOT: { id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe outra página utilizando este slug." },
        { status: 400 }
      );
    }

    const page = await prisma.page.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ success: true, page });
  } catch (error: any) {
    console.error("Erro ao atualizar página:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou página não encontrada." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui uma página (Protegido)
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
        { error: "ID da página é obrigatório." },
        { status: 400 }
      );
    }

    // Impede a exclusão de páginas do sistema protegidas
    const pageToDelete = await prisma.page.findUnique({ where: { id } });
    if (pageToDelete && ["home", "sobre", "o-que-fazemos", "contato"].includes(pageToDelete.slug)) {
      return NextResponse.json(
        { error: "Esta página é essencial para o funcionamento do site e não pode ser excluída." },
        { status: 400 }
      );
    }

    await prisma.page.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Página excluída com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir página:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou página não encontrada." },
      { status: 500 }
    );
  }
}
