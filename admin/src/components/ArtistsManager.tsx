"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Trash2,
  Music,
  Star,
  ToggleLeft,
  ToggleRight,
  X,
  Upload,
  Loader2,
  Search,
} from "lucide-react";

interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
  featured: boolean;
  active: boolean;
}

interface ArtistsManagerProps {
  initialArtists: Artist[];
}

export function ArtistsManager({ initialArtists }: ArtistsManagerProps) {
  const router = useRouter();
  const [artists, setArtists] = useState<Artist[]>(initialArtists);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);

  // Estados do Formulário
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [order, setOrder] = useState(0);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  // Estados de Carregamento
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Abre o modal para criar
  const handleOpenCreate = () => {
    setEditingArtist(null);
    setName("");
    setImageUrl("");
    setOrder(artists.length + 1);
    setFeatured(false);
    setActive(true);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Abre o modal para editar
  const handleOpenEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setName(artist.name);
    setImageUrl(artist.imageUrl);
    setOrder(artist.order);
    setFeatured(artist.featured);
    setActive(artist.active);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  // Upload para o Supabase Storage via rota API
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "artists");

    try {
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
      setErrorMsg("A foto do artista é obrigatória.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      name,
      imageUrl,
      order: Number(order),
      featured,
      active,
    };

    try {
      const url = editingArtist
        ? `/api/artistas?id=${editingArtist.id}`
        : "/api/artistas";
      const method = editingArtist ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar artista");

      setIsModalOpen(false);
      router.refresh();

      if (editingArtist) {
        setArtists(
          artists.map((a) => (a.id === editingArtist.id ? data.artist : a))
        );
      } else {
        setArtists([...artists, data.artist].sort((a, b) => a.order - b.order));
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha ao salvar. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  // Exclui artista
  const handleDelete = async (id: string) => {
    if (!confirm("Deseja mesmo excluir este artista permanentemente?")) return;

    try {
      const res = await fetch(`/api/artistas?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir artista");
      }

      setArtists(artists.filter((a) => a.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Falha ao excluir o artista.");
    }
  };

  // Alterna o status ativo/inativo
  const handleToggleActive = async (artist: Artist) => {
    const updatedArtist = { ...artist, active: !artist.active };

    try {
      const res = await fetch(`/api/artistas?id=${artist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedArtist),
      });

      if (!res.ok) throw new Error();

      setArtists(artists.map((a) => (a.id === artist.id ? updatedArtist : a)));
      router.refresh();
    } catch (err) {
      alert("Falha ao alternar status do artista.");
    }
  };

  // Alterna o destaque na home
  const handleToggleFeatured = async (artist: Artist) => {
    const updatedArtist = { ...artist, featured: !artist.featured };

    try {
      const res = await fetch(`/api/artistas?id=${artist.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedArtist),
      });

      if (!res.ok) throw new Error();

      setArtists(artists.map((a) => (a.id === artist.id ? updatedArtist : a)));
      router.refresh();
    } catch (err) {
      alert("Falha ao alternar destaque do artista.");
    }
  };

  // Filtra artistas por nome na barra de busca
  const filteredArtists = artists.filter((artist) =>
    artist.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-space font-bold text-text">Gerenciar Artistas</h2>
          <p className="text-xs text-muted2 mt-0.5">
            Cadastre artistas parceiros para a lista e marquee rotativa da página inicial.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
        >
          <Plus size={16} />
          Adicionar Artista
        </button>
      </div>

      {/* Filtro de Busca */}
      <div className="flex items-center gap-3 bg-bg-card border border-line2 rounded-xl px-4 py-2.5 max-w-md w-full">
        <Search className="text-muted2" size={16} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar artista por nome..."
          className="bg-transparent text-text text-xs outline-none w-full placeholder:text-muted2"
        />
      </div>

      {/* Grid de Artistas */}
      {filteredArtists.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-line2 rounded-xl bg-bg-card/50">
          <Music className="mx-auto text-muted2 mb-3" size={32} />
          <p className="text-xs text-muted2">Nenhum artista encontrado.</p>
          {searchTerm ? (
            <button
              onClick={() => setSearchTerm("")}
              className="text-xs text-accent font-semibold mt-2 hover:underline"
            >
              Limpar busca
            </button>
          ) : (
            <button
              onClick={handleOpenCreate}
              className="text-xs text-accent font-semibold mt-2 hover:underline"
            >
              Adicionar meu primeiro artista →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredArtists.map((artist) => (
            <div
              key={artist.id}
              className={`rounded-xl bg-bg-card border p-4 transition-all flex flex-col items-center justify-between text-center relative ${
                artist.active ? "border-line2" : "border-line2 opacity-60"
              }`}
            >
              {/* Botão de Destaque Estrela no Canto */}
              <button
                onClick={() => handleToggleFeatured(artist)}
                className={`absolute top-3 right-3 p-1 rounded-full border transition-all ${
                  artist.featured
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-500"
                    : "bg-black/40 border-line2 text-muted2 hover:text-text"
                }`}
                title={artist.featured ? "Remover dos destaques da Home" : "Destacar na Home Marquee"}
              >
                <Star size={12} fill={artist.featured ? "currentColor" : "none"} />
              </button>

              {/* Informações */}
              <div className="space-y-4 flex flex-col items-center w-full">
                {/* Imagem do Artista (Círculo) */}
                <div className="w-20 h-20 rounded-full overflow-hidden border border-line2 bg-black/40 relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={artist.imageUrl}
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=600&auto=format&fit=crop";
                    }}
                  />
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-text truncate max-w-[140px]">
                    {artist.name}
                  </h4>
                  <div className="flex items-center justify-center gap-1.5 mt-1">
                    <span className="text-[9px] text-muted2 font-light">
                      Ordem: {artist.order}
                    </span>
                    {artist.featured && (
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-wide">
                        Home
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ações */}
              <div className="w-full mt-4 pt-3 border-t border-line2 flex items-center justify-between">
                <button
                  onClick={() => handleToggleActive(artist)}
                  className="flex items-center gap-1 text-[10px] text-muted2 hover:text-text transition-colors"
                >
                  {artist.active ? (
                    <span className="text-emerald-500 font-medium">Ativo</span>
                  ) : (
                    <span className="font-medium">Inativo</span>
                  )}
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(artist)}
                    className="p-1 rounded bg-surface text-muted2 hover:text-text hover:bg-surface-hover border border-line2 transition-all"
                    title="Editar"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    onClick={() => handleDelete(artist.id)}
                    className="p-1 rounded bg-surface text-red-400/80 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-all"
                    title="Excluir"
                  >
                    <Trash2 size={11} />
                  </button>
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
                {editingArtist ? "Editar Artista" : "Novo Artista"}
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

              {/* Nome */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  Nome do Artista
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Nando Reis"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Foto do Artista */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                  Foto do Artista (Quadrada recomendada)
                </label>

                {imageUrl && (
                  <div className="flex items-center gap-4 p-3 border border-line2 rounded-lg bg-bg">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-line2 shrink-0 bg-black/20">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        className="text-xs text-red-400 hover:text-red-300 font-semibold"
                      >
                        Remover Foto
                      </button>
                    </div>
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

              {/* Toggles Destaque e Ativo */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block mb-1">
                    Destaque na Home
                  </span>
                  <button
                    type="button"
                    onClick={() => setFeatured(!featured)}
                    className="flex items-center gap-1.5 text-xs text-text outline-none"
                    disabled={isSaving}
                  >
                    {featured ? (
                      <>
                        <ToggleRight className="text-amber-500" size={22} />
                        <span className="text-[10px] text-amber-500 font-semibold">Sim, no Marquee</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-muted2" size={22} />
                        <span className="text-[10px] text-muted2">Não mostrar</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1">
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
                        <span className="text-[10px] text-emerald-500 font-semibold">Publicado</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="text-muted2" size={22} />
                        <span className="text-[10px] text-muted2">Rascunho (Oculto)</span>
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
