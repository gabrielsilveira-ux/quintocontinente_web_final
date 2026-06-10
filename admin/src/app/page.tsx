import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { LoginForm } from "@/components/LoginForm";

export default async function LoginPage() {
  // 1. Verifica no servidor se o usuário já possui sessão ativa
  const session = await getServerSession(authOptions);

  // 2. Se logado, redireciona diretamente ao Dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="min-h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-bg">
      {/* Círculos decorativos em gradiente de fundo */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[120px] pointer-events-none pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-accent/5 blur-[120px] pointer-events-none pulse-glow" style={{ animationDelay: "2s" }} />

      {/* Formulário de Login */}
      <LoginForm />
    </main>
  );
}
