"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/imageCompressor";
import {
  Plus,
  Edit2,
  Trash2,
  FileText,
  X,
  Upload,
  Loader2,
  Search,
  Layout,
  Layers,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
} from "lucide-react";

interface PageSection {
  id: string;
  pageId: string;
  title: string | null;
  subtitle: string | null;
  content: string | null;
  imageUrl: string | null;
  videoUrl: string | null;
  bgType: string;
  order: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  keywords: string | null;
  active: boolean;
  sections?: PageSection[];
}

interface PagesManagerProps {
  initialPages: Page[];
}

export function PagesManager({ initialPages }: PagesManagerProps) {
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPage, setSelectedPage] = useState<Page | null>(null);
  
  // Page Modal States
  const [isPageModalOpen, setIsPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageTitle, setPageTitle] = useState("");
  const [pageSlug, setPageSlug] = useState("");
  const [pageDescription, setPageDescription] = useState("");
  const [pageKeywords, setPageKeywords] = useState("");
  const [pageActive, setPageActive] = useState(true);

  // Section Modal States
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<PageSection | null>(null);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionSubtitle, setSectionSubtitle] = useState("");
  const [sectionContent, setSectionContent] = useState("");
  const [sectionImageUrl, setSectionImageUrl] = useState("");
  const [sectionVideoUrl, setSectionVideoUrl] = useState("");
  const [sectionBgType, setSectionBgType] = useState("DARK"); // DARK or WHITE
  const [sectionOrder, setSectionOrder] = useState(0);

  // Loading States
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFetchingSections, setIsFetchingSections] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Auto-generate slug
  const slugify = (text: string) => {
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/--+/g, "-");
  };

  const handlePageTitleChange = (val: string) => {
    setPageTitle(val);
    if (!editingPage) {
      setPageSlug(slugify(val));
    }
  };

  const handlePageSlugChange = (val: string) => {
    setPageSlug(slugify(val));
  };

  // Fetch sections of a selected page
  const fetchPageDetails = async (page: Page) => {
    setIsFetchingSections(true);
    try {
      const res = await fetch(`/api/paginas?slug=${page.slug}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPage(data);
      }
    } catch (err) {
      console.error("Erro ao buscar detalhes da página:", err);
    } finally {
      setIsFetchingSections(false);
    }
  };

  // Open create page modal
  const handleOpenCreatePage = () => {
    setEditingPage(null);
    setPageTitle("");
    setPageSlug("");
    setPageDescription("");
    setPageKeywords("");
    setPageActive(true);
    setErrorMsg("");
    setIsPageModalOpen(true);
  };

  // Open edit page modal
  const handleOpenEditPage = (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPage(page);
    setPageTitle(page.title);
    setPageSlug(page.slug);
    setPageDescription(page.description || "");
    setPageKeywords(page.keywords || "");
    setPageActive(page.active);
    setErrorMsg("");
    setIsPageModalOpen(true);
  };

  // Save Page
  const handleSavePage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pageTitle || !pageSlug) {
      setErrorMsg("Título e Slug são obrigatórios.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      title: pageTitle,
      slug: pageSlug,
      description: pageDescription || null,
      keywords: pageKeywords || null,
      active: pageActive,
    };

    try {
      const url = editingPage ? `/api/paginas?id=${editingPage.id}` : "/api/paginas";
      const method = editingPage ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar página");

      setIsPageModalOpen(false);
      router.refresh();

      // Refresh list
      if (editingPage) {
        setPages(pages.map((p) => (p.id === editingPage.id ? data.page : p)));
        if (selectedPage && selectedPage.id === editingPage.id) {
          setSelectedPage({ ...selectedPage, ...data.page });
        }
      } else {
        setPages([...pages, data.page]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar página.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Page
  const handleDeletePage = async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    if (["home", "sobre", "o-que-fazemos", "contato"].includes(page.slug)) {
      alert("Esta página é do sistema e não pode ser excluída.");
      return;
    }

    if (!confirm(`Deseja mesmo excluir a página "${page.title}" permanentemente? Todas as suas seções serão apagadas.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/paginas?id=${page.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir página.");
      }

      setPages(pages.filter((p) => p.id !== page.id));
      if (selectedPage && selectedPage.id === page.id) {
        setSelectedPage(null);
      }
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Falha ao excluir página.");
    }
  };

  // Toggle Page Active State
  const handleTogglePageActive = async (page: Page, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = { ...page, active: !page.active };
    try {
      const res = await fetch(`/api/paginas?id=${page.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: updated.title,
          slug: updated.slug,
          description: updated.description,
          keywords: updated.keywords,
          active: updated.active,
        }),
      });

      if (!res.ok) throw new Error();

      setPages(pages.map((p) => (p.id === page.id ? updated : p)));
      if (selectedPage && selectedPage.id === page.id) {
        setSelectedPage(updated);
      }
      router.refresh();
    } catch (err) {
      alert("Falha ao atualizar status da página.");
    }
  };

  // ----------------------------------------------------
  // SECTION OPERATIONS
  // ----------------------------------------------------

  // Open create section modal
  const handleOpenCreateSection = () => {
    if (!selectedPage) return;
    setEditingSection(null);
    setSectionTitle("");
    setSectionSubtitle("");
    setSectionContent("");
    setSectionImageUrl("");
    setSectionVideoUrl("");
    setSectionBgType("DARK");
    setSectionOrder((selectedPage.sections?.length || 0) + 1);
    setErrorMsg("");
    setIsSectionModalOpen(true);
  };

  // Open edit section modal
  const handleOpenEditSection = (section: PageSection) => {
    setEditingSection(section);
    setSectionTitle(section.title || "");
    setSectionSubtitle(section.subtitle || "");
    setSectionContent(section.content || "");
    setSectionImageUrl(section.imageUrl || "");
    setSectionVideoUrl(section.videoUrl || "");
    setSectionBgType(section.bgType);
    setSectionOrder(section.order);
    setErrorMsg("");
    setIsSectionModalOpen(true);
  };

  // Upload image/banner to Supabase Storage
  const handleSectionImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const compressedFile = await compressImage(file, 1200, 1200, 0.75);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", "banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao realizar upload");

      setSectionImageUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao enviar a imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save Section
  const handleSaveSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPage) return;

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      title: sectionTitle.trim() || null,
      subtitle: sectionSubtitle.trim() || null,
      content: sectionContent.trim() || null,
      imageUrl: sectionImageUrl.trim() || null,
      videoUrl: sectionVideoUrl.trim() || null,
      bgType: sectionBgType,
      order: Number(sectionOrder),
    };

    try {
      const url = editingSection
        ? `/api/paginas/secoes?id=${editingSection.id}`
        : `/api/paginas/secoes?pageId=${selectedPage.id}`;
      const method = editingSection ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar seção");

      setIsSectionModalOpen(false);
      router.refresh();

      // Reload detail page
      fetchPageDetails(selectedPage);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar seção.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Section
  const handleDeleteSection = async (id: string) => {
    if (!confirm("Deseja mesmo excluir esta seção de conteúdo permanentemente?")) return;

    try {
      const res = await fetch(`/api/paginas/secoes?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      if (selectedPage) {
        setSelectedPage({
          ...selectedPage,
          sections: selectedPage.sections?.filter((s) => s.id !== id),
        });
      }
      router.refresh();
    } catch (err) {
      alert("Falha ao excluir seção.");
    }
  };

  // Reorder sections manually (up/down)
  const handleMoveSection = async (section: PageSection, direction: "up" | "down") => {
    if (!selectedPage || !selectedPage.sections) return;
    
    const sections = [...selectedPage.sections];
    const index = sections.findIndex((s) => s.id === section.id);
    if (index === -1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    // Swap order property
    const tempOrder = sections[index].order;
    sections[index].order = sections[targetIndex].order;
    sections[targetIndex].order = tempOrder;

    // Save changes for both swapped sections
    try {
      await Promise.all([
        fetch(`/api/paginas/secoes?id=${sections[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: sections[index].title,
            subtitle: sections[index].subtitle,
            content: sections[index].content,
            imageUrl: sections[index].imageUrl,
            videoUrl: sections[index].videoUrl,
            bgType: sections[index].bgType,
            order: sections[index].order,
          }),
        }),
        fetch(`/api/paginas/secoes?id=${sections[targetIndex].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: sections[targetIndex].title,
            subtitle: sections[targetIndex].subtitle,
            content: sections[targetIndex].content,
            imageUrl: sections[targetIndex].imageUrl,
            videoUrl: sections[targetIndex].videoUrl,
            bgType: sections[targetIndex].bgType,
            order: sections[targetIndex].order,
          }),
        }),
      ]);

      router.refresh();
      fetchPageDetails(selectedPage);
    } catch (err) {
      alert("Erro ao reordenar seções.");
    }
  };

  const filteredPages = pages.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      
      {/* LADO ESQUERDO: LISTA DE PÁGINAS (4 colunas) */}
      <div className="lg:col-span-5 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-space font-bold text-text">Páginas do Site</h2>
            <p className="text-xs text-muted2 mt-0.5">Gerencie os títulos e o conteúdo dinâmico das páginas.</p>
          </div>
          <button
            onClick={handleOpenCreatePage}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10 shrink-0"
          >
            <Plus size={14} />
            Nova Página
          </button>
        </div>

        {/* Input de Busca */}
        <div className="flex items-center gap-3 bg-bg-card border border-line2 rounded-xl px-4 py-2.5 w-full">
          <Search className="text-muted2" size={16} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar página..."
            className="bg-transparent text-text text-xs outline-none w-full placeholder:text-muted2"
          />
        </div>

        {/* Lista das Páginas */}
        <div className="space-y-3">
          {filteredPages.map((page) => {
            const isSelected = selectedPage?.id === page.id;
            const isSystemPage = ["home", "sobre", "o-que-fazemos", "contato"].includes(page.slug);
            return (
              <div
                key={page.id}
                onClick={() => fetchPageDetails(page)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-accent-dim/10 border-accent/40"
                    : "bg-bg-card border-line2 hover:border-muted2/50"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-lg ${isSelected ? "bg-accent-dim text-accent" : "bg-bg text-muted2"}`}>
                    <FileText size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-semibold text-text truncate">{page.title}</h4>
                    <span className="text-[10px] text-muted2 font-mono truncate block">/{page.slug}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {/* Status Toggle */}
                  <button
                    onClick={(e) => handleTogglePageActive(page, e)}
                    className={`p-1.5 rounded hover:bg-surface border border-line2 transition-colors ${
                      page.active ? "text-emerald-400" : "text-muted2"
                    }`}
                    title={page.active ? "Desativar página" : "Ativar página"}
                  >
                    {page.active ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>

                  {/* Editar */}
                  <button
                    onClick={(e) => handleOpenEditPage(page, e)}
                    className="p-1.5 rounded bg-surface text-muted2 hover:text-text hover:bg-surface-hover border border-line2 transition-colors"
                    title="Configurações da Página"
                  >
                    <Edit2 size={12} />
                  </button>

                  {/* Excluir (Se não for do sistema) */}
                  {!isSystemPage && (
                    <button
                      onClick={(e) => handleDeletePage(page, e)}
                      className="p-1.5 rounded bg-surface text-red-400/80 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-colors"
                      title="Excluir Página"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* LADO DIREITO: SEÇÕES DA PÁGINA SELECIONADA (7 colunas) */}
      <div className="lg:col-span-7">
        {!selectedPage ? (
          <div className="py-24 text-center border border-dashed border-line2 rounded-xl bg-bg-card/30 flex flex-col items-center justify-center">
            <Layout className="text-muted2 mb-4" size={40} />
            <h3 className="text-sm font-semibold text-text">Selecione uma Página</h3>
            <p className="text-xs text-muted2 mt-1 max-w-[280px] mx-auto">
              Clique em uma página da lista ao lado para gerenciar suas seções de conteúdo e banners.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header da Página Selecionada */}
            <div className="bg-bg-card border border-line2 p-6 rounded-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line2 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-space font-bold text-text text-base">{selectedPage.title}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                      selectedPage.active
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                    }`}>
                      {selectedPage.active ? "Ativa" : "Rascunho"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted2 font-mono mt-0.5">slug: /{selectedPage.slug}</p>
                </div>
                
                <button
                  onClick={handleOpenCreateSection}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all active:scale-[0.98]"
                >
                  <Plus size={14} />
                  Adicionar Seção
                </button>
              </div>

              {/* Detalhes de SEO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[9px] text-muted2 uppercase font-bold tracking-wider">Meta Description (SEO)</span>
                  <p className="text-text font-light italic bg-bg/50 p-2.5 rounded border border-line2 min-h-[36px]">
                    {selectedPage.description || "Nenhuma descrição informada."}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-muted2 uppercase font-bold tracking-wider">Keywords</span>
                  <p className="text-text font-light italic bg-bg/50 p-2.5 rounded border border-line2 min-h-[36px]">
                    {selectedPage.keywords || "Nenhuma palavra-chave informada."}
                  </p>
                </div>
              </div>
            </div>

            {/* Listagem de Seções */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-accent flex items-center gap-2">
                <Layers size={14} />
                Seções de Conteúdo ({selectedPage.sections?.length || 0})
              </h4>

              {isFetchingSections ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-accent" size={24} />
                </div>
              ) : !selectedPage.sections || selectedPage.sections.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-line2 rounded-xl bg-bg-card/50">
                  <p className="text-xs text-muted2">Esta página não possui nenhuma seção. Adicione sua primeira seção acima!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPage.sections.map((section, idx) => (
                    <div
                      key={section.id}
                      className="bg-bg-card border border-line2 rounded-xl p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-6"
                    >
                      <div className="space-y-3 min-w-0 flex-1">
                        
                        {/* Tags e Info */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-bg text-muted2 border border-line2">
                            Ordem: {section.order}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold border ${
                            section.bgType === "WHITE"
                              ? "bg-zinc-100 text-zinc-800 border-zinc-300"
                              : "bg-zinc-900 text-zinc-200 border-zinc-700"
                          }`}>
                            Fundo: {section.bgType === "WHITE" ? "Claro (White)" : "Escuro (Dark)"}
                          </span>
                          {section.imageUrl && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              Contém Imagem
                            </span>
                          )}
                          {section.videoUrl && (
                            <span className="px-2 py-0.5 rounded text-[8px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              Contém Vídeo
                            </span>
                          )}
                        </div>

                        {/* Textos */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-semibold text-text">{section.title || "(Sem título)"}</h4>
                          {section.subtitle && (
                            <h5 className="text-[10px] text-accent font-medium">{section.subtitle}</h5>
                          )}
                          {section.content && (
                            <p className="text-[11px] text-muted2 line-clamp-3 font-light leading-relaxed">
                              {section.content}
                            </p>
                          )}
                        </div>

                        {/* Thumbnail da Imagem se houver */}
                        {section.imageUrl && (
                          <div className="w-24 h-16 rounded overflow-hidden border border-line2 bg-black/40">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={section.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      {/* Controles de Seção */}
                      <div className="flex sm:flex-col items-center gap-1 shrink-0 self-end sm:self-start">
                        {/* Botões Reordenar */}
                        <div className="flex sm:flex-row gap-1 mr-3 sm:mr-0 sm:mb-2">
                          <button
                            onClick={() => handleMoveSection(section, "up")}
                            disabled={idx === 0}
                            className="p-1 rounded bg-surface border border-line2 hover:text-text disabled:opacity-35 transition-opacity"
                            title="Mover para Cima"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={() => handleMoveSection(section, "down")}
                            disabled={idx === selectedPage.sections!.length - 1}
                            className="p-1 rounded bg-surface border border-line2 hover:text-text disabled:opacity-35 transition-opacity"
                            title="Mover para Baixo"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>

                        {/* Ações CRUD */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleOpenEditSection(section)}
                            className="p-1.5 rounded bg-surface text-muted2 hover:text-text hover:bg-surface-hover border border-line2 transition-colors"
                            title="Editar Seção"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteSection(section.id)}
                            className="p-1.5 rounded bg-surface text-red-400/80 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-colors"
                            title="Excluir Seção"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ========================================================
          PAGE MODAL: CRIAR / EDITAR PÁGINA
          ======================================================== */}
      {isPageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel">
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                {editingPage ? "Editar Página" : "Nova Página"}
              </h3>
              <button
                onClick={() => setIsPageModalOpen(false)}
                className="text-muted2 hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePage} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs text-center font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Título */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Título da Página
                </label>
                <input
                  type="text"
                  required
                  value={pageTitle}
                  onChange={(e) => handlePageTitleChange(e.target.value)}
                  placeholder="Ex: Quem Somos"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Slug */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 flex items-center justify-between">
                  <span>Slug da URL</span>
                  <span className="text-[8px] text-muted2 font-normal">letras minúsculas e hifens</span>
                </label>
                <input
                  type="text"
                  required
                  value={pageSlug}
                  onChange={(e) => handlePageSlugChange(e.target.value)}
                  placeholder="Ex: quem-somos"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text font-mono text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving || !!(editingPage && ["home", "sobre", "o-que-fazemos", "contato"].includes(editingPage.slug))}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Meta Description (SEO)
                </label>
                <textarea
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  placeholder="Descrição que aparece nos resultados do Google..."
                  rows={2}
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2 outline-none transition-all resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Keywords */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Keywords (SEO)
                </label>
                <input
                  type="text"
                  value={pageKeywords}
                  onChange={(e) => setPageKeywords(e.target.value)}
                  placeholder="Palavras-chave separadas por vírgula..."
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Toggle de Status */}
              <div className="flex items-center justify-between pt-2 border-t border-line2/50">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted2">Status da Página</span>
                <button
                  type="button"
                  onClick={() => setPageActive(!pageActive)}
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    pageActive ? "text-emerald-500" : "text-muted2"
                  }`}
                  disabled={isSaving}
                >
                  {pageActive ? "Publicada (Visível)" : "Rascunho (Oculta)"}
                </button>
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-line2">
                <button
                  type="button"
                  onClick={() => setIsPageModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2 text-xs font-semibold transition-all"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold text-xs transition-all shadow-lg shadow-accent/10"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          SECTION MODAL: CRIAR / EDITAR SEÇÃO
          ======================================================== */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel max-h-[90vh]">
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                {editingSection ? "Editar Seção" : "Nova Seção"}
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="text-muted2 hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSection} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs text-center font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Título da Seção */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Título Principal (H2)
                </label>
                <input
                  type="text"
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="Ex: Inteligência de Mercado"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Subtítulo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Subtítulo / Chamada Secundária
                </label>
                <input
                  type="text"
                  value={sectionSubtitle}
                  onChange={(e) => setSectionSubtitle(e.target.value)}
                  placeholder="Ex: Curadoria de Artistas sob Medida"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Conteúdo / Texto Principal */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Conteúdo / Descrição do Bloco
                </label>
                <textarea
                  value={sectionContent}
                  onChange={(e) => setSectionContent(e.target.value)}
                  placeholder="Texto explicativo ou de apoio..."
                  rows={4}
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2 outline-none transition-all resize-y"
                  disabled={isSaving}
                />
              </div>

              {/* Configuração de Imagem/Banner */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                  Imagem / Banner do Bloco
                </label>

                {sectionImageUrl && (
                  <div className="flex items-center gap-4 p-3 border border-line2 rounded-lg bg-bg">
                    <div className="w-16 h-12 rounded overflow-hidden border border-line2 shrink-0 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sectionImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setSectionImageUrl("")}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
                      >
                        Remover Mídia
                      </button>
                    </div>
                  </div>
                )}

                {!sectionImageUrl && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex flex-col items-center justify-center p-3 border border-dashed border-line2 hover:border-accent/40 rounded-lg bg-bg cursor-pointer hover:bg-bg-alt/30 transition-all text-center">
                      {isUploading ? (
                        <Loader2 className="animate-spin text-accent mb-1.5" size={16} />
                      ) : (
                        <Upload className="text-muted2 mb-1.5" size={16} />
                      )}
                      <span className="text-[9px] font-semibold text-text">
                        {isUploading ? "Enviando..." : "Upload de Banner"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSectionImageUpload}
                        className="hidden"
                        disabled={isUploading || isSaving}
                      />
                    </label>

                    <div className="flex flex-col justify-center p-2.5 border border-line2 rounded-lg bg-bg space-y-1.5">
                      <span className="text-[9px] font-semibold text-muted2">Cole URL de Imagem</span>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/foto.jpg"
                        onChange={(e) => setSectionImageUrl(e.target.value)}
                        className="w-full bg-bg-alt border border-line2 focus:border-accent text-text text-[10px] rounded px-2.5 py-1.5 outline-none transition-all"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Link do Vídeo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  URL de Vídeo (Opcional)
                </label>
                <input
                  type="url"
                  value={sectionVideoUrl}
                  onChange={(e) => setSectionVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Ordem de Exibição */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                    Fundo da Seção
                  </label>
                  <select
                    value={sectionBgType}
                    onChange={(e) => setSectionBgType(e.target.value)}
                    className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3 py-2.5 outline-none transition-all cursor-pointer"
                    disabled={isSaving}
                  >
                    <option value="DARK">Escuro (Dark)</option>
                    <option value="WHITE">Claro (White)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                    Posição / Ordem
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={sectionOrder}
                    onChange={(e) => setSectionOrder(Number(e.target.value))}
                    className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-line2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2 text-xs font-semibold transition-all"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold text-xs transition-all shadow-lg shadow-accent/10"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
