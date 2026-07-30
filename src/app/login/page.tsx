"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { btnPrimary, inputCls } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-dim font-bold text-[#06281c]">C</div>
          <span className="text-lg font-semibold tracking-tight">CareerForge</span>
        </Link>
        <div className="rounded-xl border border-edge bg-surface p-6">
          <h1 className="text-lg font-semibold">Sign in</h1>
          <p className="mt-1 text-xs text-muted">Your application pipeline is waiting.</p>
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input className={inputCls} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-xs text-danger">{error}</p>}
            <button className={`${btnPrimary} w-full`} disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-muted">
          No account?{" "}
          <Link href="/register" className="font-medium text-accent hover:underline">
            Create one free
          </Link>
        </p>
      </div>
    </main>
  );
}
