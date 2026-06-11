"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/imageCompressor";
import {
  Plus,
  Edit2,
  Trash2,
  Images,
  ToggleLeft,
  ToggleRight,
  X,
  Upload,
  Loader2,
  Grid,
} from "lucide-react";

interface GalleryItem {
  id: string;
  title: string | null;
  imageUrl: string;
  category: string;
  order: number;
  active: boolean;
}

interface GalleryManagerProps {
  initialItems: GalleryItem[];
}

export function GalleryManager({ initialItems }: GalleryManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<GalleryItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Estados do Formulário
  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [category, setCategory] = useState("Geral");
  const [order, setOrder] = useState(0);
  const [active, setActive] = useState(true);

  // Estados de Carregamento
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const categories = ["Todos", "Geral", "Shows", "Eventos", "Corporativos"];

  // Abre o modal para criar
  const handleOpenCreate = () => {
    setEditingItem(null);
    setTitle("");
    setImageUrl("");
    setCategory(activeCategory === "Todos" ? "Geral" : activeCategory);
    setOrder(items.length + 1);
    setActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Abre o modal para editar
  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setTitle(item.title || "");
    setImageUrl(item.imageUrl);
    setCategory(item.category);
    setOrder(item.order);
    setActive(item.active);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Upload para o Supabase Storage via rota API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const compressedFile = await compressImage(file, 1200, 1200, 0.75);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", "gallery");

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

  // Salva no banco de dados
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setErrorMsg("A imagem é obrigatória.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      title: title || null,
      imageUrl,
      category,
      order: Number(order),
      active,
    };

    try {
      const url = editingItem
        ? `/api/galeria?id=${editingItem.id}`
        : "/api/galeria";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar item");

      setIsModalOpen(false);
      router.refresh();

      if (editingItem) {
        setItems(
          items.map((i) => (i.id === editingItem.id ? data.item : i))
        );
      } else {
        setItems([...items, data.item].sort((a, b) => a.order - b.order));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha ao salvar. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  // Exclui item
  const handleDelete = async (id: string) => {
    if (!confirm("Deseja mesmo excluir esta foto da galeria permanentemente?")) return;

    try {
      const res = await fetch(`/api/galeria?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir item");
      }

      setItems(items.filter((i) => i.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Falha ao excluir o registro.");
    }
  };

  // Alterna o status ativo
  const handleToggleActive = async (item: GalleryItem) => {
    const updatedItem = { ...item, active: !item.active };

    try {
      const res = await fetch(`/api/galeria?id=${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      });

      if (!res.ok) throw new Error();

      setItems(items.map((i) => (i.id === item.id ? updatedItem : i)));
      router.refresh();
    } catch (err) {
      alert("Falha ao alternar status do item.");
    }
  };

  // Filtra itens por categoria selecionada nas abas
  const filteredItems = items.filter(
    (item) => activeCategory === "Todos" || item.category === activeCategory
  );

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-space font-bold text-text">Gerenciar Galeria</h2>
          <p className="text-xs text-muted2 mt-0.5">
            Organize fotos de shows e produções para serem exibidas na página de Galeria.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
        >
          <Plus size={16} />
          Adicionar Foto
        </button>
      </div>

      {/* Abas de Filtros de Categoria */}
      <div className="flex flex-wrap gap-2 border-b border-line2 pb-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeCategory === cat
                ? "bg-accent-dim text-accent border border-accent/20"
                : "text-muted2 hover:text-text hover:bg-bg-card border border-transparent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de Fotos */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-line2 rounded-xl bg-bg-card/50">
          <Images className="mx-auto text-muted2 mb-3" size={32} />
          <p className="text-xs text-muted2">Nenhuma foto cadastrada nesta categoria.</p>
          <button
            onClick={handleOpenCreate}
            className="text-xs text-accent font-semibold mt-2 hover:underline"
          >
            Adicionar foto agora →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl bg-bg-card border transition-all overflow-hidden flex flex-col justify-between ${
                item.active ? "border-line2" : "border-line2 opacity-60"
              }`}
            >
              {/* Imagem */}
              <div className="relative aspect-square w-full bg-black/40 border-b border-line2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={item.title || "Foto da Galeria"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop";
                  }}
                />
                <span className="absolute top-3 left-3 px-2 py-0.5 rounded text-[9px] font-bold bg-black/80 text-accent border border-accent/20">
                  {item.category}
                </span>
                <span className="absolute top-3 right-3 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/80 text-text">
                  Ordem: {item.order}
                </span>
              </div>

              {/* Informações e Ações */}
              <div className="p-4 flex flex-col justify-between space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-text truncate">
                    {item.title || <span className="text-muted2 font-light italic">Sem legenda</span>}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-line2">
                  <button
                    onClick={() => handleToggleActive(item)}
                    className="flex items-center gap-1 text-[10px] text-muted2 hover:text-text transition-colors"
                  >
                    {item.active ? (
                      <span className="text-emerald-500 font-medium">Ativo</span>
                    ) : (
                      <span className="font-medium">Oculto</span>
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1 rounded bg-surface text-muted2 hover:text-text hover:bg-surface-hover border border-line2 transition-all"
                      title="Editar"
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-1 rounded bg-surface text-red-400/80 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-all"
                      title="Excluir"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel max-h-[90vh]">
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                {editingItem ? "Editar Foto" : "Nova Foto"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted2 hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs text-center font-medium">
                  {errorMsg}
                </div>
              )}

              {/* Legenda (Opcional) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Legenda / Título (Opcional)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Show Nando Reis - São Paulo"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                >
                  <option value="Geral">Geral</option>
                  <option value="Shows">Shows</option>
                  <option value="Eventos">Eventos</option>
                  <option value="Corporativos">Corporativos</option>
                </select>
              </div>

              {/* Upload de Imagem */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                  Foto
                </label>

                {imageUrl && (
                  <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-line2 bg-black/20">
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
                    <label className="flex flex-col items-center justify-center p-4 border border-dashed border-line2 hover:border-accent/40 rounded-lg bg-bg cursor-pointer hover:bg-bg-alt/30 transition-all text-center">
                      {isUploading ? (
                        <Loader2 className="animate-spin text-accent mb-1.5" size={18} />
                      ) : (
                        <Upload className="text-muted2 mb-1.5" size={18} />
                      )}
                      <span className="text-[9px] font-semibold text-text">
                        {isUploading ? "Enviando..." : "Upload de Foto"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={isUploading || isSaving}
                      />
                    </label>

                    <div className="flex flex-col justify-center p-3 border border-line2 rounded-lg bg-bg space-y-1.5">
                      <span className="text-[9px] font-semibold text-muted2">Ou cole uma URL</span>
                      <input
                        type="url"
                        placeholder="https://exemplo.com/foto.jpg"
                        onChange={(e) => setImageUrl(e.target.value)}
                        className="w-full bg-bg-alt border border-line2 focus:border-accent text-text text-[10px] rounded px-2.5 py-1.5 outline-none transition-all"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Ordem de Exibição */}
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

              {/* Status Ativo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block mb-1">
                  Status Ativo
                </span>
                <button
                  type="button"
                  onClick={() => setActive(!active)}
                  className="flex items-center gap-1.5 text-xs text-text outline-none"
                  disabled={isSaving}
                >
                  {active ? (
                    <>
                      <ToggleRight className="text-emerald-500" size={22} />
                      <span className="text-[10px] text-emerald-500 font-semibold">Publicado (Visível)</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="text-muted2" size={22} />
                      <span className="text-[10px] text-muted2">Oculto (Rascunho)</span>
                    </>
                  )}
                </button>
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
                    "Salvar Foto"
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
