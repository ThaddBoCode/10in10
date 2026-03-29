"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthGuard";
import { Target, Scale } from "lucide-react";

export default function LoginPage() {
  const { login, register, loading } = useAuth();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <Scale size={48} className="animate-pulse" style={{ color: "var(--primary)" }} />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const fn = isRegister ? register : login;
    const result = await fn(name.trim(), pin);
    if (!result.ok) setError(result.error || "Fehler");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-8">
      <div
        className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl"
        style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}
      >
        <Target size={48} className="text-white" />
      </div>

      <h1
        className="font-heading text-3xl"
        style={{ background: "var(--gradient-primary)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
      >
        10in10
      </h1>
      <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
        Gemeinsam zum Ziel
      </p>

      <form onSubmit={handleSubmit} className="mt-10 w-full max-w-sm space-y-4">
        <div>
          <label className="font-body mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Dein Name"
            className="font-body w-full rounded-[14px] px-5 py-4 text-base outline-none"
            style={{
              background: "var(--bg-input, var(--bg-card))",
              border: "2px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        <div>
          <label className="font-body mb-2 block text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
            PIN
          </label>
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Dein PIN"
            className="font-body w-full rounded-[14px] px-5 py-4 text-base outline-none"
            style={{
              background: "var(--bg-input, var(--bg-card))",
              border: "2px solid var(--border)",
              color: "var(--text)",
            }}
          />
        </div>

        {error && (
          <p className="text-center text-sm font-semibold" style={{ color: "var(--danger)" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          className="font-heading w-full rounded-[14px] py-4 text-base font-bold text-white transition-transform hover:-translate-y-0.5"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--glow-primary)" }}
        >
          {isRegister ? "Registrieren" : "Anmelden"}
        </button>

        <button
          type="button"
          onClick={() => { setIsRegister(!isRegister); setError(""); }}
          className="font-body w-full rounded-[14px] py-4 text-sm font-semibold"
          style={{
            background: "transparent",
            border: "2px solid var(--border)",
            color: "var(--text-secondary)",
          }}
        >
          {isRegister ? "Bereits registriert? Anmelden" : "Neu hier? Registrieren"}
        </button>
      </form>
    </div>
  );
}
