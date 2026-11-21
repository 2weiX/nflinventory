"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

const NAV = [
  { href: "/", label: "Inventory" },
  { href: "/cards/new", label: "Add card" },
  { href: "/import", label: "Import" },
  { href: "/sales", label: "Sales & profit" },
];

export default function AuthGate({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null && pathname !== "/login") router.replace("/login");
  }, [session, pathname, router]);

  if (pathname === "/login") return <>{children}</>;
  if (!session) return <div className="p-8 text-sm text-zinc-500">Loading…</div>;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold tracking-tight">🏈 NFL Inventory</Link>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.map((n) => {
              const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
              return (
                <Link key={n.href} href={n.href}
                  className={`rounded-md px-2.5 py-1 ${active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button className="ml-auto text-sm text-zinc-500 hover:text-zinc-900" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
