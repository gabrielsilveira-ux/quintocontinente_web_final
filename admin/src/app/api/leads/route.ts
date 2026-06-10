import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { leadSchema } from "@/lib/schemas";

// GET: Retorna os leads recebidos (Protegido)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const leads = await prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(leads);
  } catch (error: any) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro ao buscar contatos." },
      { status: 500 }
    );
  }
}

// POST: Cria um novo lead (Público - chamado pelo site estático)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        eventType: parsed.data.eventType,
        artistInterest: parsed.data.artistInterest || null,
        status: "NOVO", // Sempre entra como novo
        utmSource: parsed.data.utmSource || null,
        utmMedium: parsed.data.utmMedium || null,
        utmCampaign: parsed.data.utmCampaign || null,
        utmContent: parsed.data.utmContent || null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Mensagem enviada com sucesso!", lead },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Erro ao registrar lead:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao enviar a mensagem." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza o status do lead (Protegido)
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
        { error: "ID do contato é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !["NOVO", "EM_ATENDIMENTO", "CONCLUIDO", "ARQUIVADO"].includes(status)) {
      return NextResponse.json(
        { error: "Status inválido." },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ success: true, lead });
  } catch (error: any) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou contato não encontrado." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui um lead (Protegido)
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
        { error: "ID do contato é obrigatório." },
        { status: 400 }
      );
    }

    await prisma.lead.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Contato excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou contato não encontrado." },
      { status: 500 }
    );
  }
}
