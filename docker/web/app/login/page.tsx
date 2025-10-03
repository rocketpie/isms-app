//app/login/page.tsx
"use client";

import { useState } from "react";
import { auth } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signin") {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await auth.signUp({ email, password });
        if (error) throw error;
      }
      window.location.assign("/assets/processes");
    } catch (err: any) {
      setError(err?.message ?? "Auth error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10 bg-white p-6 rounded-2xl shadow">
      <h1 className="text-xl font-semibold mb-4">
        {mode === "signin" ? "Sign in" : "Sign up"}
      </h1>
      <form className="grid gap-3" onSubmit={handleSubmit}>
        <input
          type="email"
          name="username"
          autoComplete="username"
          placeholder="you@example.com"
          className="border rounded-lg px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          name="current-password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder="••••••••"
          className="border rounded-lg px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl px-3 py-2 border bg-black text-white disabled:opacity-60"
        >
          {loading
            ? "Working…"
            : mode === "signin"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>
      <button
        className="mt-3 text-sm text-neutral-600 hover:text-black"
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Have an account? Sign in"}
      </button>
    </div>
  );
}
