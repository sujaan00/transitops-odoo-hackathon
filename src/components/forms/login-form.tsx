"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const demoAccounts = [
  "admin@transitops.local",
  "dispatcher@transitops.local",
  "fleet@transitops.local",
  "safety@transitops.local",
  "finance@transitops.local"
];

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState(demoAccounts[0]);
  const [password, setPassword] = useState("TransitOps@123");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    setLoading(false);

    if (result?.error) {
      toast.error("Invalid email or password.");
      return;
    }

    toast.success("Welcome back to TransitOps.");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border bg-card p-6 shadow-sm">
      <label className="block text-sm font-medium">
        Email
        <input className="mt-2 w-full" value={email} onChange={(event) => setEmail(event.target.value)} type="email" autoComplete="email" required />
      </label>
      <label className="block text-sm font-medium">
        Password
        <input
          className="mt-2 w-full"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <Button className="w-full" disabled={loading}>
        {loading ? "Signing in..." : "Sign in"}
      </Button>
      <div className="rounded-md bg-muted/60 p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Demo accounts</p>
        <div className="mt-2 grid gap-1">
          {demoAccounts.map((account) => (
            <button key={account} type="button" className="text-left hover:text-foreground" onClick={() => setEmail(account)}>
              {account}
            </button>
          ))}
        </div>
        <p className="mt-2">Password for all demo users: TransitOps@123</p>
      </div>
    </form>
  );
}
