"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { compressImage } from "@/lib/imageCompressor";
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
  Link as LinkIcon,
  Instagram,
  FileText,
  Image as ImageIcon,
  Check,
} from "lucide-react";

interface Artist {
  id: string;
  name: string;
  slug: string;
  imageUrl: string;
  bio?: string | null;
  genre?: string | null;
  websiteUrl?: string | null;
  instagramUrl?: string | null;
  spotifyUrl?: string | null;
  galleryUrls: string[];
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
  const [formTab, setFormTab] = useState<"basico" | "bio_social" | "galeria">("basico");

  // Estados do Formulário
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [bio, setBio] = useState("");
  const [genre, setGenre] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [order, setOrder] = useState(0);
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);

  // Selecionar da galeria existente
  const [generalGallery, setGeneralGallery] = useState<{ id: string; title: string | null; imageUrl: string }[]>([]);
  const [isFetchingGallery, setIsFetchingGallery] = useState(false);
  const [externalUrlInput, setExternalUrlInput] = useState("");

  // Estados de Carregamento
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Helper para normalizar slug
  const slugify = (text: string) => {
    return text
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-") // Substitui espaços por hifens
      .replace(/[^\w-]+/g, "") // Remove caracteres não-palavra exceto hifens
      .replace(/--+/g, "-"); // Substitui múltiplos hifens por um único
  };

  // Buscar Galeria do site
  const fetchGeneralGallery = async () => {
    setIsFetchingGallery(true);
    try {
      const res = await fetch("/api/galeria");
      if (res.ok) {
        const data = await res.json();
        setGeneralGallery(data);
      }
    } catch (err) {
      console.error("Erro ao buscar galeria do site:", err);
    } finally {
      setIsFetchingGallery(false);
    }
  };

  // Carregar galeria quando o modal é aberto
  useEffect(() => {
    if (isModalOpen) {
      fetchGeneralGallery();
    }
  }, [isModalOpen]);

  // Atualiza slug automaticamente no cadastro
  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingArtist) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(slugify(val));
  };

  // Abre o modal para criar
  const handleOpenCreate = () => {
    setEditingArtist(null);
    setName("");
    setSlug("");
    setImageUrl("");
    setBio("");
    setGenre("");
    setWebsiteUrl("");
    setInstagramUrl("");
    setSpotifyUrl("");
    setGalleryUrls([]);
    setOrder(artists.length + 1);
    setFeatured(false);
    setActive(true);
    setErrorMsg("");
    setFormTab("basico");
    setIsModalOpen(true);
  };

  // Abre o modal para editar
  const handleOpenEdit = (artist: Artist) => {
    setEditingArtist(artist);
    setName(artist.name);
    setSlug(artist.slug);
    setImageUrl(artist.imageUrl);
    setBio(artist.bio || "");
    setGenre(artist.genre || "");
    setWebsiteUrl(artist.websiteUrl || "");
    setInstagramUrl(artist.instagramUrl || "");
    setSpotifyUrl(artist.spotifyUrl || "");
    setGalleryUrls(artist.galleryUrls || []);
    setOrder(artist.order);
    setFeatured(artist.featured);
    setActive(artist.active);
    setErrorMsg("");
    setFormTab("basico");
    setIsModalOpen(true);
  };

  // Upload para o Supabase Storage via rota API (Foto principal)
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setErrorMsg("");

    try {
      const compressedFile = await compressImage(file);
      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("bucket", "artists");

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

  // Upload múltiplo para a galeria de fotos do artista
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingGallery(true);
    setErrorMsg("");

    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const compressedFile = await compressImage(file);
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("bucket", "artists");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || `Erro no upload da imagem ${file.name}`);
        uploadedUrls.push(data.url);
      }

      setGalleryUrls((prev) => [...prev, ...uploadedUrls]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao enviar fotos para galeria.");
    } finally {
      setIsUploadingGallery(false);
    }
  };

  // Adicionar URL externa à galeria
  const handleAddExternalUrl = () => {
    if (!externalUrlInput.trim()) return;
    if (!externalUrlInput.startsWith("http://") && !externalUrlInput.startsWith("https://")) {
      setErrorMsg("Insira uma URL válida contendo http:// ou https://");
      return;
    }
    setGalleryUrls((prev) => [...prev, externalUrlInput.trim()]);
    setExternalUrlInput("");
    setErrorMsg("");
  };

  // Alterna foto da galeria do site no array do artista
  const handleToggleSiteGalleryImage = (url: string) => {
    if (galleryUrls.includes(url)) {
      setGalleryUrls((prev) => prev.filter((u) => u !== url));
    } else {
      setGalleryUrls((prev) => [...prev, url]);
    }
  };

  // Salva no banco de dados
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      setErrorMsg("A foto do artista é obrigatória.");
      setFormTab("bio_social");
      return;
    }
    if (!slug) {
      setErrorMsg("O slug da URL é obrigatório.");
      setFormTab("basico");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      name,
      slug,
      imageUrl,
      bio: bio.trim() || null,
      genre: genre.trim() || null,
      websiteUrl: websiteUrl.trim() || null,
      instagramUrl: instagramUrl.trim() || null,
      spotifyUrl: spotifyUrl.trim() || null,
      galleryUrls,
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
            Cadastre artistas parceiros, suas biografias, redes sociais e galerias de fotos para o site.
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
                  <p className="text-[10px] text-muted2 italic truncate max-w-[140px] mt-0.5">
                    {artist.genre || "Sem gênero"}
                  </p>
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

      {/* Modal de Criação / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-xl rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel max-h-[92vh]">
            
            {/* Cabeçalho */}
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                {editingArtist ? `Editar Artista: ${name}` : "Novo Artista"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted2 hover:text-text transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Abas do Formulário */}
            <div className="flex border-b border-line2 bg-bg-card/30">
              <button
                type="button"
                onClick={() => setFormTab("basico")}
                className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  formTab === "basico"
                    ? "border-accent text-accent bg-bg-alt/30"
                    : "border-transparent text-muted2 hover:text-text hover:bg-bg-card/20"
                }`}
              >
                <FileText size={13} />
                Dados Básicos
              </button>
              <button
                type="button"
                onClick={() => setFormTab("bio_social")}
                className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  formTab === "bio_social"
                    ? "border-accent text-accent bg-bg-alt/30"
                    : "border-transparent text-muted2 hover:text-text hover:bg-bg-card/20"
                }`}
              >
                <LinkIcon size={13} />
                Bio & Links
              </button>
              <button
                type="button"
                onClick={() => setFormTab("galeria")}
                className={`flex-1 py-3 text-center text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
                  formTab === "galeria"
                    ? "border-accent text-accent bg-bg-alt/30"
                    : "border-transparent text-muted2 hover:text-text hover:bg-bg-card/20"
                }`}
              >
                <ImageIcon size={13} />
                Galeria ({galleryUrls.length})
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh] flex-1">
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs text-center font-medium">
                    {errorMsg}
                  </div>
                )}

                {/* ABA 1: DADOS BÁSICOS */}
                {formTab === "basico" && (
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                        Nome do Artista *
                      </label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ex: Nando Reis"
                        className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 flex items-center justify-between">
                        <span>Slug da URL *</span>
                        <span className="text-[9px] text-muted2 lowercase italic font-normal">
                          slug amigável: quintocontinente.com.br/artistas/{slug || "slug"}
                        </span>
                      </label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="Ex: nando-reis"
                        className="w-full bg-bg border border-line2 focus:border-accent text-text font-mono text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                        disabled={isSaving}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                          Gênero Musical
                        </label>
                        <input
                          type="text"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          placeholder="Ex: Rock / MPB"
                          className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                          disabled={isSaving}
                        />
                      </div>

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
                    </div>

                    {/* Toggles Destaque e Ativo */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-line2/50">
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
                              <span className="text-[10px] text-muted2">Não destacar</span>
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
                  </div>
                )}

                {/* ABA 2: BIO & LINKS */}
                {formTab === "bio_social" && (
                  <div className="space-y-4">
                    {/* Foto Principal */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                        Foto do Artista (Capa/Perfil) *
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

                    {/* Biografia */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                        Biografia do Artista
                      </label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Breve história, conquistas e descrição do artista..."
                        rows={4}
                        className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all resize-y"
                        disabled={isSaving}
                      />
                    </div>

                    {/* Links */}
                    <div className="space-y-3 pt-2 border-t border-line2/50">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-accent">Links e Redes Sociais</h4>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 bg-bg border border-line2 rounded-lg px-3 py-1.5 focus-within:border-accent transition-all">
                          <LinkIcon size={14} className="text-muted2 shrink-0" />
                          <input
                            type="url"
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            placeholder="Site Oficial (https://...)"
                            className="bg-transparent text-text text-xs outline-none w-full placeholder:text-muted2"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center gap-2 bg-bg border border-line2 rounded-lg px-3 py-1.5 focus-within:border-accent transition-all">
                          <Instagram size={14} className="text-muted2 shrink-0" />
                          <input
                            type="url"
                            value={instagramUrl}
                            onChange={(e) => setInstagramUrl(e.target.value)}
                            placeholder="Instagram (https://instagram.com/...)"
                            className="bg-transparent text-text text-xs outline-none w-full placeholder:text-muted2"
                            disabled={isSaving}
                          />
                        </div>

                        <div className="flex items-center gap-2 bg-bg border border-line2 rounded-lg px-3 py-1.5 focus-within:border-accent transition-all">
                          <Music size={14} className="text-muted2 shrink-0" />
                          <input
                            type="url"
                            value={spotifyUrl}
                            onChange={(e) => setSpotifyUrl(e.target.value)}
                            placeholder="Spotify (https://open.spotify.com/artist/...)"
                            className="bg-transparent text-text text-xs outline-none w-full placeholder:text-muted2"
                            disabled={isSaving}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ABA 3: GALERIA DE FOTOS */}
                {formTab === "galeria" && (
                  <div className="space-y-4">
                    {/* Upload / URL Area */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-bg p-4 rounded-xl border border-line2">
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                          Upload de Novas Fotos
                        </span>
                        <label className="flex flex-col items-center justify-center p-3 border border-dashed border-line2 hover:border-accent/40 rounded-lg bg-bg-alt cursor-pointer hover:bg-bg/40 transition-all text-center">
                          {isUploadingGallery ? (
                            <Loader2 className="animate-spin text-accent mb-1.5" size={16} />
                          ) : (
                            <Upload className="text-muted2 mb-1.5" size={16} />
                          )}
                          <span className="text-[9px] font-semibold text-text">
                            {isUploadingGallery ? "Enviando..." : "Subir Arquivos (Múltiplos)"}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handleGalleryUpload}
                            className="hidden"
                            disabled={isUploadingGallery || isSaving}
                          />
                        </label>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                          Adicionar URL Externa
                        </span>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            placeholder="https://exemplo.com/foto.jpg"
                            value={externalUrlInput}
                            onChange={(e) => setExternalUrlInput(e.target.value)}
                            className="w-full bg-bg-alt border border-line2 focus:border-accent text-text text-[10px] rounded-lg px-2.5 py-2 outline-none transition-all"
                            disabled={isSaving}
                          />
                          <button
                            type="button"
                            onClick={handleAddExternalUrl}
                            className="px-3 py-2 rounded-lg bg-accent text-white font-semibold text-[10px] transition-all hover:bg-accent/90"
                          >
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Fotos Atuais */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                        Fotos Selecionadas para o Artista ({galleryUrls.length})
                      </span>

                      {galleryUrls.length === 0 ? (
                        <p className="text-[10px] text-muted2 italic py-4 text-center border border-dashed border-line2 rounded-lg">
                          Nenhuma foto na galeria do artista. Use os controles acima ou selecione da galeria do site abaixo.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                          {galleryUrls.map((url, idx) => (
                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-line2 group bg-black/40">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Galeria ${idx}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => setGalleryUrls((prev) => prev.filter((_, i) => i !== idx))}
                                className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 text-[10px] font-semibold"
                              >
                                <X size={14} className="mb-0.5" />
                                Remover
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Fotos Existentes no Banco (Galeria Geral) */}
                    <div className="space-y-2 pt-2 border-t border-line2/50">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted2 block">
                        Importar da Galeria Geral do Site
                      </span>

                      {isFetchingGallery ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="animate-spin text-accent" size={16} />
                        </div>
                      ) : generalGallery.length === 0 ? (
                        <p className="text-[10px] text-muted2 italic py-4 text-center">
                          A galeria geral do site está vazia.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-[160px] overflow-y-auto pr-1">
                          {generalGallery.map((item) => {
                            const isSelected = galleryUrls.includes(item.imageUrl);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleToggleSiteGalleryImage(item.imageUrl)}
                                className={`relative aspect-square rounded-lg overflow-hidden border transition-all bg-black/20 ${
                                  isSelected ? "border-accent ring-2 ring-accent/30" : "border-line2 hover:border-muted2"
                                }`}
                                title={item.title || "Imagem da galeria"}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={item.imageUrl} alt="Galeria" className="w-full h-full object-cover" />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-accent/20 flex items-center justify-center">
                                    <div className="bg-accent rounded-full p-0.5">
                                      <Check size={10} className="text-white" />
                                    </div>
                                  </div>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Botões do Rodapé */}
              <div className="px-6 py-4 border-t border-line2 bg-bg-alt/50 flex items-center justify-between">
                {/* Navegação Rápida entre Abas */}
                <div className="flex gap-1">
                  {formTab !== "basico" && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === "galeria" ? "bio_social" : "basico")}
                      className="px-3 py-1.5 rounded bg-surface hover:bg-surface-hover text-muted2 hover:text-text border border-line2 text-[10px] font-semibold transition-all"
                    >
                      Voltar
                    </button>
                  )}
                  {formTab !== "galeria" && (
                    <button
                      type="button"
                      onClick={() => setFormTab(formTab === "basico" ? "bio_social" : "galeria")}
                      className="px-3 py-1.5 rounded bg-surface hover:bg-surface-hover text-text border border-line2 text-[10px] font-semibold transition-all"
                    >
                      Avançar
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
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
                    disabled={isSaving || isUploading || isUploadingGallery}
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
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
