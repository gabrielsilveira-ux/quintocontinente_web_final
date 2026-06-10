"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Plus,
  Trash2,
  Users,
  X,
  User,
  Shield,
  Loader2,
  Calendar,
  Edit2,
} from "lucide-react";

interface UserType {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UsersManagerProps {
  initialUsers: UserType[];
}

export function UsersManager({ initialUsers }: UsersManagerProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [users, setUsers] = useState<UserType[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);

  // Estados do Formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("ADMIN");

  // Estados de Carregamento
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleOpenCreate = () => {
    setEditingUser(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("ADMIN");
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: UserType) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword(""); // Senha vazia significa não alterar
    setRole(user.role);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se for criação, a senha é obrigatória. Se for edição, ela é opcional.
    if (!editingUser && password.length < 6) {
      setErrorMsg("A senha deve conter pelo menos 6 caracteres.");
      return;
    }
    if (editingUser && password && password.length < 6) {
      setErrorMsg("A nova senha deve conter pelo menos 6 caracteres.");
      return;
    }

    setIsSaving(true);
    setErrorMsg("");

    const payload = {
      name,
      email,
      password: password || undefined,
      role,
    };

    try {
      const url = editingUser ? `/api/usuarios?id=${editingUser.id}` : "/api/usuarios";
      const method = editingUser ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar usuário");

      setIsModalOpen(false);
      router.refresh();

      if (editingUser) {
        setUsers(users.map((u) => (u.id === editingUser.id ? data.user : u)));
      } else {
        setUsers([data.user, ...users]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Falha ao salvar usuário. Verifique os dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, userEmail: string) => {
    // Evita autoexclusão no cliente
    if (session?.user?.id === id) {
      alert("Você não pode excluir a sua própria conta.");
      return;
    }

    if (!confirm(`Tem certeza que deseja excluir o colaborador "${userEmail}" permanentemente?`))
      return;

    try {
      const res = await fetch(`/api/usuarios?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erro ao excluir usuário");
      }

      setUsers(users.filter((u) => u.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err.message || "Falha ao excluir o colaborador.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Topo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-space font-bold text-text">Gerenciar Colaboradores</h2>
          <p className="text-xs text-muted2 mt-0.5">
            Cadastre novos administradores ou editores para conceder acesso ao painel de gerenciamento.
          </p>
        </div>
        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-accent hover:bg-accent/90 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
        >
          <Plus size={16} />
          Adicionar Colaborador
        </button>
      </div>

      {/* Tabela de Colaboradores */}
      <div className="bg-bg-card border border-line2 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-line2 text-muted2 uppercase tracking-wider font-semibold bg-bg-alt/20">
                <th className="py-4 px-6">Nome</th>
                <th className="py-4 px-6">E-mail de Acesso</th>
                <th className="py-4 px-6">Cargo</th>
                <th className="py-4 px-6">Cadastrado em</th>
                <th className="py-4 px-6 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line2">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-bg-alt/30 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface border border-line2 flex items-center justify-center text-muted2 shrink-0">
                        <User size={14} />
                      </div>
                      <p className="font-semibold text-text">{user.name}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-text">{user.email}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        user.role === "ADMIN"
                          ? "bg-accent-dim text-accent border border-accent/20"
                          : "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-muted2 font-light">
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} />
                      {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 rounded bg-surface text-muted2 hover:text-accent hover:bg-accent/10 border border-line2 hover:border-accent/30 transition-all opacity-0 group-hover:opacity-100"
                        title="Editar Colaborador / Alterar Senha"
                      >
                        <Edit2 size={12} />
                      </button>

                      {session?.user?.id !== user.id ? (
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="p-1.5 rounded bg-surface text-muted2 hover:text-red-400 hover:bg-red-950/20 border border-line2 hover:border-red-950/50 transition-all opacity-0 group-hover:opacity-100"
                          title="Excluir Colaborador"
                        >
                          <Trash2 size={12} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-muted2 italic font-light pr-2">Sua conta</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md rounded-xl bg-bg-alt border border-line2 overflow-hidden flex flex-col glass-panel max-h-[90vh]">
            <div className="px-6 py-4 border-b border-line2 flex items-center justify-between">
              <h3 className="font-space font-bold text-text text-sm uppercase tracking-wider">
                {editingUser ? "Editar Colaborador" : "Novo Colaborador"}
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
                  Nome do Colaborador
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Gabriel Silveira"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* E-mail */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gabriel@quintocontinente.com.br"
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2">
                  {editingUser ? "Nova Senha (deixe em branco para manter)" : "Senha Temporária (Mín. 6 caracteres)"}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? "Deixe em branco para não alterar" : "••••••••"}
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                />
              </div>

              {/* Cargo / Role */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted2 flex items-center gap-1.5">
                  <Shield size={12} />
                  Nível de Permissão
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-bg border border-line2 focus:border-accent text-text text-xs rounded-lg px-3.5 py-2.5 outline-none transition-all"
                  disabled={isSaving}
                >
                  <option value="ADMIN">ADMIN (Controle total de conteúdos e acessos)</option>
                  <option value="EDITOR">EDITOR (Apenas edição de conteúdos)</option>
                </select>
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
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-lg bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold text-xs transition-all active:scale-[0.98] shadow-lg shadow-accent/10"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      Salvando...
                    </>
                  ) : (
                    editingUser ? "Salvar Alterações" : "Cadastrar"
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
