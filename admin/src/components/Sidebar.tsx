"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Image as ImageIcon,
  Music,
  Images,
  MailOpen,
  Users,
  LogOut,
  Menu,
  X,
  User,
  FileText,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
    { name: "Banners", href: "/dashboard/banners", icon: ImageIcon },
    { name: "Gerenciar Páginas", href: "/dashboard/paginas", icon: FileText },
    { name: "Artistas", href: "/dashboard/artistas", icon: Music },
    { name: "Galeria", href: "/dashboard/galeria", icon: Images },
    { name: "Contatos (Leads)", href: "/dashboard/leads", icon: MailOpen },
  ];

  // Apenas admins podem ver gerenciamento de usuários
  if (session?.user?.role === "ADMIN") {
    menuItems.push({ name: "Usuários", href: "/dashboard/usuarios", icon: Users });
  }

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      {/* Botão Hambúrguer para Celular */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-bg-card border border-line2 text-text lg:hidden hover:bg-surface transition-colors"
        aria-label={isOpen ? "Fechar Menu" : "Abrir Menu"}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Backdrop para Celular */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar Lateral */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 border-r border-line2 bg-bg-alt flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Logo / Header */}
          <div className="h-20 border-b border-line2 flex items-center px-6">
            <div>
              <span className="font-space text-lg font-bold tracking-tight text-text">
                Quinto<span className="text-accent">Continente</span>
              </span>
              <p className="text-[10px] text-muted2 uppercase tracking-widest font-medium">
                Painel Admin
              </p>
            </div>
          </div>

          {/* Perfil do Usuário */}
          <div className="p-4 border-b border-line2 bg-bg-card/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent-dim border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-text truncate">
                {session?.user?.name || "Administrador"}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-bold text-muted2 uppercase tracking-wide">
                  {session?.user?.role || "ADMIN"}
                </span>
              </div>
            </div>
          </div>

          {/* Links de Navegação */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all group ${
                    isActive
                      ? "bg-accent-dim text-accent border-l-2 border-accent font-semibold"
                      : "text-muted2 hover:text-text hover:bg-bg-card"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`transition-colors ${
                      isActive ? "text-accent" : "text-muted2 group-hover:text-text"
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Botão de Sair (Logout) */}
        <div className="p-4 border-t border-line2 bg-bg-card/10">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400/80 hover:text-red-400 hover:bg-red-950/20 border border-transparent hover:border-red-950/40 transition-all"
          >
            <LogOut size={18} />
            Sair do Painel
          </button>
        </div>
      </aside>
    </>
  );
}
