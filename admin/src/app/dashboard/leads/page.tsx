import React from "react";
import prisma from "@/lib/db";
import { LeadsManager } from "@/components/LeadsManager";

export const revalidate = 0; // Evita cache, sempre atualizado

export default async function LeadsPage() {
  // 1. Busca todos os contatos por ordem de recebimento (mais recente primeiro)
  const leads = await prisma.lead.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  // Mapeia datas para string para evitar erros de serialização NextJS Client Component
  const serializedLeads = leads.map((lead) => ({
    ...lead,
    createdAt: lead.createdAt.toISOString(),
  }));

  return (
    <div className="w-full">
      {/* Renderiza o gerenciador interativo no lado do cliente */}
      <LeadsManager initialLeads={serializedLeads} />
    </div>
  );
}
