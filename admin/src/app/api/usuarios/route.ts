import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import * as bcrypt from "bcryptjs";
import { userSchema } from "@/lib/schemas";

// GET: Lista todos os usuários (Apenas para ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // 1. Verifica se está logado e se é ADMIN
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado. Apenas administradores principais têm acesso." },
        { status: 403 }
      );
    }

    // 2. Seleciona os campos omitindo o passwordHash
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// POST: Cria um novo colaborador (Apenas para ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado. Acesso restrito a administradores." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    if (!password) {
      return NextResponse.json(
        { error: "A senha é obrigatória para criação." },
        { status: 400 }
      );
    }

    // Verifica se e-mail já existe
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado no sistema." },
        { status: 400 }
      );
    }

    // Criptografa a senha
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Cria o usuário
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, user }, { status: 201 });
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// PUT: Atualiza um colaborador (Apenas para ADMIN)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado. Acesso restrito a administradores." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = userSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, email, password, role } = parsed.data;

    // Verifica se o email já está sendo usado por outro usuário
    const existingUserWithEmail = await prisma.user.findFirst({
      where: {
        email,
        id: { not: id }
      }
    });

    if (existingUserWithEmail) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado em outra conta." },
        { status: 400 }
      );
    }

    // Prepara os dados para atualização
    const updateData: any = {
      name,
      email,
      role
    };

    // Se a senha foi preenchida, criptografa e atualiza
    if (password && password.trim() !== "") {
      const salt = bcrypt.genSaltSync(10);
      updateData.passwordHash = bcrypt.hashSync(password, salt);
    }

    // Atualiza o usuário
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error: any) {
    console.error("Erro ao atualizar usuário:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// DELETE: Exclui um colaborador (Apenas para ADMIN)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado. Acesso restrito a administradores." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID do usuário é obrigatório." },
        { status: 400 }
      );
    }

    // Proteção de segurança: Impede o administrador de se autoexcluir
    if (session.user.id === id) {
      return NextResponse.json(
        { error: "Você não pode excluir a sua própria conta." },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Usuário excluído com sucesso." });
  } catch (error: any) {
    console.error("Erro ao excluir usuário:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ou usuário não encontrado." },
      { status: 500 }
    );
  }
}
