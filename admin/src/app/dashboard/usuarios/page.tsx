import React from "react";
import prisma from "@/lib/db";
import { UsersManager } from "@/components/UsersManager";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export const revalidate = 0; // Evita cache, sempre atualizado

export default async function UsersPage() {
  // 1. Verifica permissão no servidor secundariamente para reforço de segurança
  const session = await getServerSession(authOptions);
  if (!session || session.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // 2. Busca os usuários
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Mapeia datas para string para evitar erros de serialização NextJS Client Component
  const serializedUsers = users.map((user) => ({
    ...user,
    createdAt: user.createdAt.toISOString(),
  }));

  return (
    <div className="w-full">
      {/* Renderiza o gerenciador interativo no lado do cliente */}
      <UsersManager initialUsers={serializedUsers} />
    </div>
  );
}
