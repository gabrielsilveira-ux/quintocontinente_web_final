import React from "react";
import prisma from "@/lib/db";
import Link from "next/link";
import {
  Image as ImageIcon,
  Music,
  Images,
  MailOpen,
  ArrowUpRight,
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export const revalidate = 0; // Evita cache, sempre traz dados atualizados do banco

export default async function DashboardPage() {
  // 1. Consulta concorrente das métricas no banco
  const [
    bannersCount,
    artistsCount,
    galleryCount,
    totalLeads,
    newLeadsCount,
    recentLeads,
  ] = await Promise.all([
    prisma.banner.count({ where: { active: true } }),
    prisma.artist.count({ where: { active: true } }),
    prisma.galleryItem.count({ where: { active: true } }),
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "NOVO" } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  // Função para retornar o estilo do status do Lead
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "NOVO":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
            NOVO
          </span>
        );
      case "EM_ATENDIMENTO":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
            EM ATENDIMENTO
          </span>
        );
      case "CONCLUIDO":
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            CONCLUÍDO
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20">
            ARQUIVADO
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      {/* Bloco de Boas-vindas */}
      <div>
        <h2 className="text-2xl font-space font-bold tracking-tight text-text">
          Bem-vindo de volta!
        </h2>
        <p className="text-xs text-muted2 mt-1">
          Aqui está um resumo do desempenho do site institucional e das solicitações de contato.
        </p>
      </div>

      {/* Grade de Cartões de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card Banners */}
        <div className="p-6 rounded-xl bg-bg-card border border-line2 hover:border-accent/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted2 uppercase tracking-wider">
              Banners Ativos
            </span>
            <div className="p-2 rounded-lg bg-accent-dim text-accent">
              <ImageIcon size={18} />
            </div>
          </div>
          <p className="text-3xl font-space font-bold text-text mt-4">
            {bannersCount}
          </p>
          <Link
            href="/dashboard/banners"
            className="flex items-center gap-1 text-[11px] font-semibold text-accent mt-4 hover:underline"
          >
            Gerenciar Banners <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* Card Artistas */}
        <div className="p-6 rounded-xl bg-bg-card border border-line2 hover:border-accent/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted2 uppercase tracking-wider">
              Artistas Ativos
            </span>
            <div className="p-2 rounded-lg bg-accent-dim text-accent">
              <Music size={18} />
            </div>
          </div>
          <p className="text-3xl font-space font-bold text-text mt-4">
            {artistsCount}
          </p>
          <Link
            href="/dashboard/artistas"
            className="flex items-center gap-1 text-[11px] font-semibold text-accent mt-4 hover:underline"
          >
            Gerenciar Artistas <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* Card Galeria */}
        <div className="p-6 rounded-xl bg-bg-card border border-line2 hover:border-accent/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted2 uppercase tracking-wider">
              Fotos na Galeria
            </span>
            <div className="p-2 rounded-lg bg-accent-dim text-accent">
              <Images size={18} />
            </div>
          </div>
          <p className="text-3xl font-space font-bold text-text mt-4">
            {galleryCount}
          </p>
          <Link
            href="/dashboard/galeria"
            className="flex items-center gap-1 text-[11px] font-semibold text-accent mt-4 hover:underline"
          >
            Gerenciar Galeria <ArrowUpRight size={12} />
          </Link>
        </div>

        {/* Card Leads */}
        <div className="p-6 rounded-xl bg-bg-card border border-line2 hover:border-accent/30 transition-all group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-accent/5 blur-2xl group-hover:bg-accent/10 transition-all" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted2 uppercase tracking-wider">
              Total de Contatos
            </span>
            <div className="p-2 rounded-lg bg-accent-dim text-accent">
              <MailOpen size={18} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-space font-bold text-text">{totalLeads}</span>
            {newLeadsCount > 0 && (
              <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                {newLeadsCount} novos
              </span>
            )}
          </div>
          <Link
            href="/dashboard/leads"
            className="flex items-center gap-1 text-[11px] font-semibold text-accent mt-4 hover:underline"
          >
            Ver Caixa de Entrada <ArrowUpRight size={12} />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tabela de Contatos Recentes */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-bg-card border border-line2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-space font-bold text-text">
                Solicitações de Contato Recentes
              </h3>
              <p className="text-[11px] text-muted2 font-light mt-0.5">
                Últimos briefings de contratação e atendimento de shows.
              </p>
            </div>
            <Link
              href="/dashboard/leads"
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
            >
              Ver todos <ArrowUpRight size={14} />
            </Link>
          </div>

          <div className="overflow-x-auto">
            {recentLeads.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted2 font-light">
                Nenhuma solicitação de contato recebida ainda.
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-line2 text-muted2 uppercase tracking-wider font-semibold">
                    <th className="py-3 pr-4">Nome / Empresa</th>
                    <th className="py-3 px-4">Interesse / Artista</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 pl-4 text-right">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line2">
                  {recentLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-bg-alt/30 transition-colors">
                      <td className="py-3.5 pr-4">
                        <p className="font-semibold text-text">{lead.name}</p>
                        <p className="text-[10px] text-muted2 font-light">{lead.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="text-text">{lead.artistInterest || "Não especificado"}</p>
                        <p className="text-[10px] text-muted2 font-light">{lead.eventType}</p>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(lead.status)}</td>
                      <td className="py-3.5 pl-4 text-right text-muted2 font-light">
                        {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Atalhos e Links Úteis */}
        <div className="p-6 rounded-xl bg-bg-card border border-line2 space-y-6">
          <div>
            <h3 className="text-base font-space font-bold text-text">Atalhos Rápidos</h3>
            <p className="text-[11px] text-muted2 font-light mt-0.5">
              Acesse diretamente as telas de criação.
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/dashboard/banners?action=new"
              className="flex items-center gap-3 p-3 rounded-lg border border-line2 hover:border-accent/40 bg-bg-alt/35 hover:bg-accent-dim/10 text-xs font-semibold text-text group transition-all"
            >
              <PlusCircle className="text-accent group-hover:scale-110 transition-transform" size={16} />
              Adicionar Novo Banner
            </Link>

            <Link
              href="/dashboard/artistas?action=new"
              className="flex items-center gap-3 p-3 rounded-lg border border-line2 hover:border-accent/40 bg-bg-alt/35 hover:bg-accent-dim/10 text-xs font-semibold text-text group transition-all"
            >
              <PlusCircle className="text-accent group-hover:scale-110 transition-transform" size={16} />
              Adicionar Novo Artista
            </Link>

            <Link
              href="/dashboard/galeria?action=new"
              className="flex items-center gap-3 p-3 rounded-lg border border-line2 hover:border-accent/40 bg-bg-alt/35 hover:bg-accent-dim/10 text-xs font-semibold text-text group transition-all"
            >
              <PlusCircle className="text-accent group-hover:scale-110 transition-transform" size={16} />
              Adicionar Foto na Galeria
            </Link>
          </div>

          {/* Dicas de Operação */}
          <div className="p-4 rounded-lg bg-bg-alt/45 border border-line2 text-[11px] leading-relaxed text-muted2 font-light space-y-2">
            <p className="font-semibold text-text flex items-center gap-1.5">
              <Clock size={12} className="text-accent" /> Status Operacionais
            </p>
            <p>
              Ao receber um contato, mude o status para <strong>Em Atendimento</strong> para sinalizar à equipe. Marque como <strong>Concluído</strong> assim que finalizar a negociação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
