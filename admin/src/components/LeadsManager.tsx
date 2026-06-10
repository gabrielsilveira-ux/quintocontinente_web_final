"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MailOpen,
  Phone,
  Mail,
  User,
  Calendar,
  MessageSquare,
  Trash2,
  X,
  ExternalLink,
  MessageCircle,
  TrendingUp,
  Tag,
  Search,
} from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  eventType: string;
  artistInterest: string | null;
  status: string;
  createdAt: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmContent?: string | null;
}

interface LeadsManagerProps {
  initialLeads: Lead[];
}

export function LeadsManager({ initialLeads }: LeadsManagerProps) {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [activeTab, setActiveTab] = useState("TODOS");
  const [selectedCampaign, setSelectedCampaign] = useState("TODAS");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Tabs do CRM
  const tabs = [
    { name: "Todos", value: "TODOS" },
    { name: "Novos", value: "NOVO" },
    { name: "Em Atendimento", value: "EM_ATENDIMENTO" },
    { name: "Concluídos", value: "CONCLUIDO" },
    { name: "Arquivados", value: "ARQUIVADO" },
  ];

  // Extrair campanhas únicas para filtro
  const uniqueCampaigns = Array.from(
    new Set(
      leads
        .map((l) => l.utmCampaign)
        .filter((c): c is string => !!c)
    )
  );

  // Filtra leads de acordo com a tab selecionada e campanha
  const filteredLeads = leads.filter((lead) => {
    const matchTab = activeTab === "TODOS" || lead.status === activeTab;
    const matchCampaign =
      selectedCampaign === "TODAS" ||
      (selectedCampaign === "ORGANICO" && !lead.utmCampaign) ||
      lead.utmCampaign === selectedCampaign;
    return matchTab && matchCampaign;
  });

  // Formata o telefone para link do WhatsApp (apenas números, adiciona prefixo 55 se necessário)
  const getWhatsAppLink = (lead: Lead) => {
    let cleanPhone = lead.phone.replace(/\D/g, "");
    // Se não tiver o DDI do Brasil (55), assume e adiciona
    if (cleanPhone.length <= 11) {
      cleanPhone = "55" + cleanPhone;
    }
    const message = encodeURIComponent(
      `Olá ${lead.name},\n\nAqui é da equipe de atendimento estratégico da Quinto Continente. Recebemos seu briefing de interesse para contratação de show (${lead.artistInterest || "Intermediação"}). Gostaria de agendar uma breve conversa para alinharmos os detalhes?`
    );
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${message}`;
  };

  // Abre modal de detalhes
  const handleOpenDetails = (lead: Lead) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  // Atualiza o status do lead
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error();

      const data = await res.json();

      // Atualiza o estado local
      setLeads(leads.map((l) => (l.id === id ? data.lead : l)));

      // Atualiza a visualização do lead selecionado
      if (selectedLead && selectedLead.id === id) {
        setSelectedLead(data.lead);
      }

      router.refresh();
    } catch (err) {
      alert("Falha ao atualizar o status do contato.");
    }
  };

  // Exclui lead permanentemente
  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation(); // Evita abrir o modal ao clicar na lixeira na tabela
    if (!confirm("Tem certeza que deseja excluir este contato permanentemente?"))
      return;

    try {
      const res = await fetch(`/api/leads?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error();

      setLeads(leads.filter((l) => l.id !== id));
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      alert("Falha ao excluir o contato.");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "NOVO":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "EM_ATENDIMENTO":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "CONCLUIDO":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "NOVO":
        return "Novo";
      case "EM_ATENDIMENTO":
        return "Em Atendimento";
      case "CONCLUIDO":
        return "Concluído";
      default:
        return "Arquivado";
    }
  };

  // Regras de detecção de UTM
  const getUtmBadgeStyle = (lead: Lead) => {
    const medium = lead.utmMedium?.toLowerCase() || "";
    const source = lead.utmSource?.toLowerCase() || "";
    
    if (medium === "cpc" || source === "google") {
      return "bg-amber-600/10 text-amber-400 border border-amber-500/20";
    }
    if (
      source === "facebook" || 
      source === "instagram" || 
      source === "meta" ||
      medium === "paid" || 
      medium === "social"
    ) {
      return "bg-pink-600/10 text-pink-400 border border-pink-500/20";
    }
    if (lead.utmSource || lead.utmMedium) {
      return "bg-purple-600/10 text-purple-400 border border-purple-500/20";
    }
    return "bg-zinc-700/20 text-zinc-400 border border-zinc-700/30";
  };

  const getUtmBadgeLabel = (lead: Lead) => {
    const medium = lead.utmMedium?.toLowerCase() || "";
    const source = lead.utmSource?.toLowerCase() || "";
    
    if (medium === "cpc" || source === "google") {
      return "Google Ads";
    }
    if (
      source === "facebook" || 
      source === "instagram" || 
      source === "meta" ||
      medium === "paid" || 
      medium === "social"
    ) {
      return "Meta Ads";
    }
    if (lead.utmSource || lead.utmMedium) {
      return `${lead.utmSource || "Outro"} / ${lead.utmMedium || "Mídia"}`;
    }
    return "Orgânico";
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-space font-bold text-text">Caixa de Entrada (Leads)</h2>
          <p className="text-xs text-muted2 mt-0.5">
            Visualize briefings e gerencie o andamento dos contatos recebidos pelos formulários do site.
          </p>
        </div>

        {/* Filtro UTM por Campanha */}
        <div className="flex items-center gap-2 bg-bg-card border border-line2 rounded-lg px-3 py-1.5 self-start md:self-auto">
          <Tag size={13} className="text-muted2" />
          <span className="text-[10px] uppercase font-bold text-muted2 tracking-wider">Campanha:</span>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="bg-transparent text-text text-xs font-semibold outline-none cursor-pointer border-none p-0 focus:ring-0 max-w-[150px]"
          >
            <option value="TODAS" className="bg-bg text-text">Todas as origens</option>
            <option value="ORGANICO" className="bg-bg text-text">Apenas Orgânico</option>
            {uniqueCampaigns.map((camp) => (
              <option key={camp} value={camp} className="bg-bg text-text">
                {camp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-line2 pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.value
                ? "bg-accent-dim text-accent border border-accent/20"
                : "text-muted2 hover:text-text hover:bg-bg-card border border-transparent"
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tabela de Leads */}
      {filteredLeads.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-line2 rounded-xl bg-bg-card/50">
          <MailOpen className="mx-auto text-muted2 mb-3" size={32} />
          <p className="text-xs text-muted2">Nenhum contato encontrado nesta categoria.</p>
        </div>
      ) : (
        <div className="bg-bg-card border border-line2 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-line2 text-muted2 uppercase tracking-wider font-semibold bg-bg-alt/20">
                  <th className="py-4 px-6">Cliente / Empresa</th>
                  <th className="py-4 px-6">Contato</th>
                  <th className="py-4 px-6">Interesse / Evento</th>
                  <th className="py-4 px-6">Origem / Canal</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Data</th>
                  <th className="py-4 px-6 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line2">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    onClick={() => handleOpenDetails(lead)}
                    className="hover:bg-bg-alt/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6">
                      <p className="font-semibold text-text group-hover:text-accent transition-colors">
                        {lead.name}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-text">{lead.phone}</p>
                      <p className="text-[10px] text-muted2 font-light">{lead.email}</p>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-text font-medium">
                        {lead.artistInterest || "Intermediação de Shows"}
                      </p>
                      <p className="text-[10px] text-muted2 font-light">Evento {lead.eventType}</p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${getUtmBadgeStyle(lead)}`}>
                          {getUtmBadgeLabel(lead)}
                        </span>
                        {lead.utmCampaign && (
                          <span className="text-[9px] text-muted2 font-mono truncate max-w-[120px]" title={lead.utmCampaign}>
                            {lead.utmCampaign}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getStatusStyle(lead.status)}`}>
                        {getStatusLabel(lead.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-muted2 font-light">
                      {new Date(lead.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => handleDelete(lead.id, e)}
                        className="p-1.5 rounded bg-surface text-muted2 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-all opacity-0 group-hover:opacity-100"
                        title="Excluir"
                      >
                        <Trash2 size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Detalhes */}
      {isModalOpen && selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel max-h-[90vh]">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                Detalhes da Solicitação
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted2 hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 space-y-6 overflow-y-auto">
              {/* Status e Data */}
              <div className="flex items-center justify-between border-b border-line2 pb-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted2">Status Atual</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(selectedLead.status)}`}>
                      {getStatusLabel(selectedLead.status)}
                    </span>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">Recebido em</span>
                  <span className="text-xs text-text font-medium flex items-center gap-1.5 justify-end">
                    <Calendar size={12} className="text-accent" />
                    {new Date(selectedLead.createdAt).toLocaleString("pt-BR")}
                  </span>
                </div>
              </div>

              {/* Informações Pessoais */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Dados do Cliente</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-card/50 border border-line2 p-4 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted2 uppercase tracking-wide">Nome / Empresa</span>
                    <p className="text-xs text-text font-semibold flex items-center gap-1.5">
                      <User size={12} className="text-muted2" />
                      {selectedLead.name}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted2 uppercase tracking-wide">E-mail</span>
                    <p className="text-xs text-text font-medium flex items-center gap-1.5 truncate">
                      <Mail size={12} className="text-muted2" />
                      <a href={`mailto:${selectedLead.email}`} className="hover:underline hover:text-accent">
                        {selectedLead.email}
                      </a>
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <span className="text-[9px] text-muted2 uppercase tracking-wide">WhatsApp / Telefone</span>
                    <p className="text-xs text-text font-medium flex items-center gap-1.5">
                      <Phone size={12} className="text-muted2" />
                      {selectedLead.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detalhes do Briefing */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-accent">Briefing do Evento</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg-card/50 border border-line2 p-4 rounded-xl">
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted2 uppercase tracking-wide">Tipo de Evento</span>
                    <p className="text-xs text-text font-semibold">
                      Evento {selectedLead.eventType}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-muted2 uppercase tracking-wide">Artista / Estilo de Interesse</span>
                    <p className="text-xs text-text font-semibold text-accent">
                      {selectedLead.artistInterest || "Intermediação Geral"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Rastreamento de Tráfego Pago (UTM) */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                  <TrendingUp size={14} />
                  Rastreamento de Tráfego (UTMs)
                </h4>

                <div className="bg-bg-card/50 border border-line2 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-line2 pb-2">
                    <span className="text-[10px] text-muted2 uppercase font-medium">Canal de Origem:</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getUtmBadgeStyle(selectedLead)}`}>
                      {getUtmBadgeLabel(selectedLead)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[9px] text-muted2 uppercase font-light">utm_source</span>
                      <p className="font-mono text-text truncate bg-bg px-2 py-1 rounded border border-line2/50 min-h-[24px]">
                        {selectedLead.utmSource || "-"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-muted2 uppercase font-light">utm_medium</span>
                      <p className="font-mono text-text truncate bg-bg px-2 py-1 rounded border border-line2/50 min-h-[24px]">
                        {selectedLead.utmMedium || "-"}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-[9px] text-muted2 uppercase font-light">utm_campaign</span>
                      <p className="font-mono text-text truncate bg-bg px-2 py-1 rounded border border-line2/50 min-h-[24px]">
                        {selectedLead.utmCampaign || "-"}
                      </p>
                    </div>
                    <div className="space-y-1 col-span-2">
                      <span className="text-[9px] text-muted2 uppercase font-light">utm_content</span>
                      <p className="font-mono text-text truncate bg-bg px-2 py-1 rounded border border-line2/50 min-h-[24px]">
                        {selectedLead.utmContent || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ações de Atendimento */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted2">Ações Rápidas de Atendimento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp */}
                  <a
                    href={getWhatsAppLink(selectedLead)}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      if (selectedLead.status === "NOVO") {
                        handleUpdateStatus(selectedLead.id, "EM_ATENDIMENTO");
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-emerald-950/20"
                  >
                    <MessageCircle size={16} />
                    Iniciar WhatsApp
                  </a>

                  {/* E-mail */}
                  <a
                    href={`mailto:${selectedLead.email}?subject=${encodeURIComponent("Contato Quinto Continente — Intermediação Artística")}`}
                    onClick={() => {
                      if (selectedLead.status === "NOVO") {
                        handleUpdateStatus(selectedLead.id, "EM_ATENDIMENTO");
                      }
                    }}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-surface hover:bg-surface-hover text-text border border-line2 font-semibold text-xs transition-all active:scale-[0.98]"
                  >
                    <Mail size={16} />
                    Enviar E-mail
                  </a>
                </div>
              </div>

              {/* Fluxo de Status do CRM */}
              <div className="space-y-3 pt-4 border-t border-line2">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted2">Mover Status no CRM</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleUpdateStatus(selectedLead.id, "NOVO")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      selectedLead.status === "NOVO"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/30"
                        : "bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2"
                    }`}
                  >
                    Novo
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedLead.id, "EM_ATENDIMENTO")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      selectedLead.status === "EM_ATENDIMENTO"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                        : "bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2"
                    }`}
                  >
                    Em Atendimento
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedLead.id, "CONCLUIDO")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      selectedLead.status === "CONCLUIDO"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                        : "bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2"
                    }`}
                  >
                    Concluído
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedLead.id, "ARQUIVADO")}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                      selectedLead.status === "ARQUIVADO"
                        ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/30"
                        : "bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2"
                    }`}
                  >
                    Arquivar
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="px-6 py-4 border-t border-line2 bg-bg-alt/50 flex items-center justify-between">
              <button
                onClick={() => handleDelete(selectedLead.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/20 border border-red-900/40 text-red-400 hover:text-red-300 text-xs font-semibold transition-all hover:bg-red-950/40"
              >
                <Trash2 size={12} />
                Excluir Lead
              </button>
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2 text-xs font-semibold transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
