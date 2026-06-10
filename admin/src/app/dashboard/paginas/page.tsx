import React from "react";
import prisma from "@/lib/db";
import { PagesManager } from "@/components/PagesManager";

export const revalidate = 0; // Evita cache, sempre atualizado em tempo real

export default async function PagesDashboard() {
  // Busca todas as páginas cadastradas no banco
  const pages = await prisma.page.findMany({
    orderBy: {
      title: "asc",
    },
  });

  return (
    <div className="w-full">
      <PagesManager initialPages={pages} />
    </div>
  );
}
