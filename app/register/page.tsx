"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'inscription.");
      }

      setSuccess("Votre compte a été créé avec succès ! Vous pouvez maintenant vous connecter.");
      
      // On le redirige vers le login après 2 secondes...
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tr from-slate-900 via-slate-800 to-indigo-950 p-4">
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      
      <div className="relative w-full max-w-md">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 p-8 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Rejoignez-nous</h1>
            <p className="text-slate-300 text-sm">Créez votre compte en quelques secondes</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-200 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="username">
                Nom d'utilisateur
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Votre nom"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="email">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="vous@exemple.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="password">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading || !!success}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl font-bold transition-all shadow-lg transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex justify-center mt-4"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-slate-300">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-white font-semibold hover:text-indigo-300 transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
