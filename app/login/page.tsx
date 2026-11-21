"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } =
      mode === "signin"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    if (data.session) router.replace("/");
    else setMsg("Check your email to confirm the account, then sign in.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <h1 className="text-lg font-semibold">🏈 NFL Inventory</h1>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        {msg && <p className="text-sm text-red-600">{msg}</p>}
        <button className="btn-primary w-full justify-center" disabled={busy}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
        <button type="button" className="w-full text-center text-xs text-zinc-500 hover:text-zinc-900"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "First time? Create your account" : "Have an account? Sign in"}
        </button>
      </form>
    </div>
  );
}
