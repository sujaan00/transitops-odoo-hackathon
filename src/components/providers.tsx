"use client";

import { SessionProvider } from "next-auth/react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const preferred = localStorage.getItem("transitops-theme");
    const dark = preferred === "dark" || (!preferred && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    setMounted(true);
  }, []);

  return (
    <SessionProvider>
      {children}
      <Toaster richColors closeButton position="top-right" theme={mounted && document.documentElement.classList.contains("dark") ? "dark" : "light"} />
    </SessionProvider>
  );
}
