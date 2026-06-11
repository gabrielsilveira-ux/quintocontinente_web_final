"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/imageCompressor";
import {
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  ToggleLeft,
  ToggleRight,
  X,
  Upload,
  Loader2,
} from "lucide-react";

interface Banner {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  label: string | null;
  order: number;
  active: boolean;
}

interface BannersManagerProps {
  initialBanners: Banner[];
}

export function BannersManager({ initialBanners }: BannersManagerProps) {
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>(initialBanners);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  // Estados do Formulário
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [label, setLabel] = useState("Destaque");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);

  // Estados de Carregamento
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Abre o modal para criar novo banner
  const handleOpenCreate = () => {
    setEditingBanner(null);
    setTitle("");
    setDescription("");
    setImageUrl("");
    setLinkUrl("");
    setLabel("Destaque");
    setOrder(banners.length + 1);
    setActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Abre o modal para editar banner existente
  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setDescription(banner.description || "");
    setImageUrl(banner.imageUrl);
    setLinkUrl(banner.linkUrl || "");
    setLabel(banner.label || "Destaque");
    setOrder(banner.order);
    setActive(banner.active);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Upload da imagem para o Supabase Storage via API do Next
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const compressedFile = await compressImage(file, 1600, 1200, 0.8);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", "banners");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao realizar upload");

      setImageUrl(data.url);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao enviar a imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  // Salva (Cria ou Edita) o banner no Banco de Dados
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setErrorMsg("A imagem do banner é obrigatória.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      title,
      description: description || null,
      imageUrl,
      linkUrl: linkUrl || null,
      label,
      order: Number(order),
      active,
    };

    try {
      const url = editingBanner
        ? `/api/banners?id=${editingBanner.id}`
        : "/api/banners";
      const method = editingBanner ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar banner");

      setIsModalOpen(false);
      router.refresh();
      // Atualiza o estado local para atualização instantânea na listagem
      if (editingBanner) {
        setBanners(
          banners.map((b) => (b.id === editingBanner.id ? data.banner : b))
        );
      } else {
        setBanners([...banners, data.banner].sort((a, b) => a.order - b.order));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha ao salvar. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  // Exclui o banner
  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este banner permanentemente?"))
      return;

    try {
      const res = await fetch(`/api/banners?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir banner");
      }

      setBanners(banners.filter((b) => b.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Falha ao excluir o banner.");
    }
  };

  // Alterna o status ativo/inativo instantaneamente do card
  const handleToggleActive = async (banner: Banner) => {
    const updatedBanner = { ...banner, active: !banner.active };

    try {
      const res = await fetch(`/api/banners?id=${banner.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedBanner),
      });

      if (!res.ok) throw new Error();

      setBanners(banners.map((b) => (b.id === banner.id ? updatedBanner : b)));
      router.refresh();
    } catch (err) {
      alert("Falha ao alternar status do banner.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-space font-bold text-text">Gerenciar Banners</h2>
          <p className="text-xs text-muted2 mt-0.5">
            Cadastre e ordene os banners rotativos apresentados no topo da página inicial.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
        >
          <Plus size={16} />
          Adicionar Banner
        </button>
      </div>

      {/* Grid de Banners Cadastrados */}
      {banners.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-line2 rounded-xl bg-bg-card/50">
          <ImageIcon className="mx-auto text-muted2 mb-3" size={32} />
          <p className="text-xs text-muted2">Nenhum banner cadastrado no banco de dados.</p>
          <button
            onClick={handleOpenCreate}
            className="text-xs text-accent font-semibold mt-2 hover:underline"
          >
            Criar meu primeiro banner agora →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner.id}
              className={`rounded-xl bg-bg-card border transition-all overflow-hidden flex flex-col justify-between ${
                banner.active ? "border-line2" : "border-line2 opacity-60"
              }`}
            >
              {/* Imagem do Banner */}
              <div className="relative aspect-[16/8] w-full bg-black/40 border-b border-line2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop";
                  }}
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-accent border border-accent/20">
                  Ordem: {banner.order}
                </span>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-text">
                  {banner.label || "Destaque"}
                </span>
              </div>

              {/* Informações */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-sm font-semibold text-text line-clamp-1">
                    {banner.title}
                  </h4>
                  <p className="text-[11px] text-muted2 font-light mt-1.5 line-clamp-2">
                    {banner.description || "Sem descrição cadastrada."}
                  </p>
                  {banner.linkUrl && (
                    <div className="flex items-center gap-1.5 text-[10px] text-accent mt-3">
                      <LinkIcon size={10} />
                      <span className="truncate max-w-[200px]">{banner.linkUrl}</span>
                    </div>
                  )}
                </div>

                {/* Ações */}
                <div className="flex items-center justify-between pt-4 border-t border-line2">
                  <button
                    onClick={() => handleToggleActive(banner)}
                    className="flex items-center gap-1.5 text-xs text-muted2 hover:text-text transition-colors"
                  >
                    {banner.active ? (
                      <>
                        <ToggleRight className="text-emerald-500" size={18} />
                        <span className="text-[10px] font-medium text-emerald-500">Ativo</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={18} />
                        <span className="text-[10px] font-medium">Inativo</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1.5 rounded bg-surface text-muted2 hover:text-text hover:bg-surface-hover border border-line2 transition-all"
                      title="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className="p-1.5 rounded bg-surface text-red-400/80 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Formulário (Criação e Edição) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel max-h-[90vh]">
            {/* Header Modal */}
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                {editingBanner ? "Editar Banner" : "Novo Banner"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted2 hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs text-center font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Título do Banner */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Título do Banner
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Grandes Shows, Resultados Reais"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Tag / Label */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Tag / Marcador (Label)
                </label>
                <input
                  type="text"
                  required
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Ex: Destaque, Serviços, Cases"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Descrição */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Descrição / Subtítulo
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo apresentado no slide..."
                  rows={3}
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all resize-none"
                  disabled={isSaving}
                />
              </div>

              {/* Imagem do Banner (Upload ou URL) */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                  Imagem do Banner (1920x800 recomendado)
                </label>
                
                {/* Visualizador / Preview */}
                {imageUrl && (
                  <div className="relative aspect-[16/7] w-full rounded-lg overflow-hidden border border-line2 bg-black/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl("")}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/80 hover:bg-black text-red-400 hover:text-red-300 border border-red-950/50 transition-all text-xs"
                    >
                      Remover
                    </button>
                  </div>
                )}

                {!imageUrl && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Upload de arquivo */}
                    <label className="flex flex-col items-center justify-center p-6 border border-dashed border-line2 hover:border-accent/40 rounded-lg bg-bg cursor-pointer hover:bg-bg-alt/30 transition-all text-center">
                      {isUploading ? (
                        <Loader2 className="animate-spin text-accent mb-2" size={20} />
                      ) : (
                        <Upload className="text-muted2 mb-2" size={20} />
                      )}
                      <span className="text-[10px] font-semibold text-text">
                        {isUploading ? "Enviando para Supabase..." : "Fazer Upload de Imagem"}
                      </span>
                      <span className="text-[9px] text-muted2 mt-1">PNG, JPG, WEBP</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading || isSaving}
                      />
                    </label>

                    {/* Input de URL manual */}
                    <div className="flex flex-col justify-center p-4 border border-line2 rounded-lg bg-bg space-y-2">
                      <span className="text-[10px] font-semibold text-muted2">Ou Cole uma URL externa</span>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/imagem.jpg"
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-bg-alt border border-line2 focus:border-accent text-text text-[11px] rounded px-3 py-2 outline-none transition-all"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Link do CTA (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Link de Ação / CTA (Opcional)
                </label>
                <input
                  type="text"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Ex: #contato ou /servicos"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Ordem de Exibição e Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                    Ordem de Exibição
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                    disabled={isSaving}
                  />
                </div>

                <div className="space-y-1.5 flex flex-col justify-end">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 mb-2">
                    Status de Exibição
                  </label>
                  <button
                    type="button"
                    onClick={() => setActive(!active)}
                    className="flex items-center gap-2 text-xs text-text text-left outline-none self-start"
                    disabled={isSaving}
                  >
                    {active ? (
                      <>
                        <ToggleRight className="text-emerald-500" size={24} />
                        <span className="text-[11px] font-medium text-emerald-500">Visível no Site</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-muted2" size={24} />
                        <span className="text-[11px] font-medium text-muted2">Oculto (Rascunho)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Botões do Modal */}
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-line2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2 text-xs font-semibold transition-all"
                  disabled={isSaving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
