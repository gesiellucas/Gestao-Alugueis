'use client';
import React, { useState } from "react";
import { AppUser } from "../types";
import { Bike, LogIn, Lock, Mail, AlertCircle, ShieldCheck } from "lucide-react";
import { localUsersApi } from "../database/api/local/users";

interface LoginProps {
  onLogin: (user: AppUser) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRecovering, setIsRecovering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRecovering) {
        // Mock recovery for now
        setSuccess("Instruções de recuperação enviadas para o seu e-mail.");
        setTimeout(() => setIsRecovering(false), 3000);
      } else {
        const user = await localUsersApi.login(email, password);
        if (user) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('electron_user_id', String(user.id));
            localStorage.setItem('electron_user_email', user.email);
          }
          onLogin(user);
        } else {
          setError("E-mail ou senha inválidos.");
        }
      }
    } catch (err) {
      setError("Erro ao tentar conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#004AAD] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-15%] right-[-5%] w-[45%] h-[45%] bg-[#003d91] rounded-full blur-[100px] opacity-60"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-[#0C4AA5] rounded-full blur-[130px] opacity-20"></div>
        <div className="absolute top-[40%] left-[60%] w-[20%] h-[20%] bg-white rounded-full blur-[80px] opacity-5"></div>
      </div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-[#0C4AA5] p-4 rounded-3xl mb-6 shadow-2xl shadow-orange-600/40">
            <Bike className="text-white w-10 h-10" />
          </div>
          <div>
            <p className="text-orange-300 text-xs font-black uppercase tracking-[0.3em] mb-1">GC</p>
            <h1 className="text-5xl font-black text-white tracking-[-0.03em] uppercase leading-none">
              LOCAMOTO
            </h1>
            <p className="text-orange-300 text-[10px] font-bold uppercase tracking-[0.25em] mt-1.5">
              ALUGUEL DE MOTOS
            </p>
          </div>
          <p className="text-blue-200 font-medium mt-6 text-sm">
            {isRecovering ? "Recuperar sua senha" : "Acesse o sistema de gestão"}
          </p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/10 backdrop-blur-sm border border-white/15 p-8 rounded-[2rem] space-y-6">
          {error && (
            <div className="bg-red-500/20 text-red-100 border border-red-400/40 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-300 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 text-green-100 border border-green-400/40 p-4 rounded-xl flex items-center gap-3">
              <ShieldCheck size={20} className="text-green-300 flex-shrink-0" />
              <span className="text-sm font-medium">{success}</span>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-white text-xs font-bold uppercase tracking-wider mb-2 block">E-mail</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#003d91]/60 border border-white/15 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#0C4AA5]/70 focus:border-transparent transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {!isRecovering && (
              <div>
                <label className="text-white text-xs font-bold uppercase tracking-wider mb-2 block">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#003d91]/60 border border-white/15 rounded-xl py-3.5 pl-11 pr-4 text-white placeholder-blue-300/50 focus:outline-none focus:ring-2 focus:ring-[#0C4AA5]/70 focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0C4AA5] hover:bg-[#1a5cbf] text-white font-black py-4 rounded-xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl shadow-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
            ) : isRecovering ? (
              <Mail size={20} />
            ) : (
              <LogIn size={20} />
            )}
            {isRecovering ? "Enviar Recuperação" : "Entrar no Sistema"}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRecovering(!isRecovering);
                setError("");
                setSuccess("");
              }}
              className="text-blue-200 hover:text-white text-sm font-medium transition-colors"
            >
              {isRecovering ? "Voltar ao login" : "Esqueceu sua senha? Recuperar senha"}
            </button>
          </div>
        </form>

        <div className="mt-10 text-center">
          <p className="text-blue-300/60 text-xs font-bold uppercase tracking-widest">
            GC Locamoto © {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};
