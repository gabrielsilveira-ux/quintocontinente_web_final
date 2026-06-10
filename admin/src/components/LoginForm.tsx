"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { loginSchema } from "@/lib/schemas";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setErrorMessage("");
    setIsLoading(true);

    // 1. Valida os dados com o Zod
    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      setIsLoading(false);
      return;
    }

    // 2. Tenta autenticar via NextAuth
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setErrorMessage("E-mail ou senha incorretos.");
        setIsLoading(false);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Ocorreu um erro no servidor. Tente novamente mais tarde.");
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-2xl glass-panel glow-accent animate-fadeIn">
      {/* Cabeçalho */}
      <div className="text-center mb-8">
        <span className="font-space text-3xl font-extrabold tracking-tight text-text">
          Quinto<span className="text-accent">Continente</span>
        </span>
        <p className="text-sm text-muted2 mt-2 font-light">
          Acesse o painel administrativo com suas credenciais.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 rounded-lg bg-red-950/20 border border-red-900/50 text-red-400 text-xs text-center font-medium">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Campo E-mail */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted2 flex items-center gap-1.5">
            <Mail size={12} />
            E-mail
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemplo@quintocontinente.com.br"
              className={`w-full bg-bg border ${
                errors.email ? "border-red-500/50" : "border-line2"
              } focus:border-accent text-text text-sm rounded-xl px-4 py-3 outline-none transition-all focus:ring-1 focus:ring-accent/25`}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-[11px] text-red-400 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Campo Senha */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-muted2 flex items-center gap-1.5">
            <Lock size={12} />
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full bg-bg border ${
                errors.password ? "border-red-500/50" : "border-line2"
              } focus:border-accent text-text text-sm rounded-xl pl-4 pr-12 py-3 outline-none transition-all focus:ring-1 focus:ring-accent/25`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted2 hover:text-text transition-colors"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[11px] text-red-400 font-medium">{errors.password}</p>
          )}
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 bg-accent hover:bg-accent/90 disabled:bg-accent/50 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-accent/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Autenticando...
            </>
          ) : (
            "Entrar no Painel"
          )}
        </button>
      </form>
    </div>
  );
}
