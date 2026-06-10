import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Executa verificação de sessão no servidor
  const session = await getServerSession(authOptions);

  // 2. Se não estiver autenticado, redireciona para a raiz do painel (login)
  if (!session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-bg flex">
      {/* Sidebar de navegação */}
      <Sidebar />

      {/* Conteúdo Principal */}
      <div className="flex-1 lg:pl-64 min-h-screen flex flex-col">
        {/* Topbar / Cabeçalho Superior */}
        <header className="h-20 border-b border-line2 px-6 lg:px-8 flex items-center justify-between bg-bg-alt/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 pl-12 lg:pl-0">
            <h1 className="text-sm font-semibold uppercase tracking-wider text-muted2">
              Quinto Continente Admin
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted2 hidden md:inline">
              Conectado como <strong className="text-text">{session.user?.email}</strong>
            </span>
            <div className="px-2.5 py-1 rounded bg-accent-dim text-accent text-[10px] font-bold uppercase tracking-wider border border-accent/20">
              {session.user?.role}
            </div>
          </div>
        </header>

        {/* Área de Visualização das Páginas */}
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fadeIn">
          {children}
        </main>
      </div>
    </div>
  );
}
