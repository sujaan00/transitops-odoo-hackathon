"use client";

import {
  BarChart3,
  Bell,
  ChevronDown,
  FileDown,
  Fuel,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Route,
  Search,
  Settings,
  Sun,
  Truck,
  UserCog,
  Users,
  Wrench,
  X
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Session } from "next-auth";
import { Button, LinkButton } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TransitOpsLogo, TransitOpsMark } from "@/components/brand-logo";
import { hasPermission, type Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  user: Session["user"];
  unreadCount: number;
};

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: Permission;
};

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:read" },
  { href: "/vehicles", label: "Vehicles", icon: Truck, permission: "vehicles:read" },
  { href: "/drivers", label: "Drivers", icon: Users, permission: "drivers:read" },
  { href: "/trips", label: "Trips", icon: Route, permission: "trips:read" },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, permission: "maintenance:read" },
  { href: "/fuel-expenses", label: "Fuel & Expenses", icon: Fuel, permission: "finance:read" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, permission: "analytics:read" },
  { href: "/reports", label: "Reports", icon: FileDown, permission: "reports:read" },
  { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:read" },
  { href: "/users", label: "Users", icon: UserCog, permission: "users:manage" },
  { href: "/settings", label: "Settings", icon: Settings, permission: "settings:read" }
];

const quickCreate = [
  { href: "/vehicles/new", label: "New Vehicle", permission: "vehicles:manage" as Permission },
  { href: "/drivers/new", label: "New Driver", permission: "drivers:manage" as Permission },
  { href: "/trips/new", label: "New Trip", permission: "trips:manage" as Permission },
  { href: "/maintenance/new", label: "Maintenance Record", permission: "maintenance:manage" as Permission },
  { href: "/fuel-expenses/new-fuel", label: "Fuel Log", permission: "finance:manage" as Permission },
  { href: "/fuel-expenses/new-expense", label: "Expense", permission: "finance:manage" as Permission }
];

type SearchResult = {
  group: string;
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export function AppShell({ children, user, unreadCount }: AppShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const visibleNav = useMemo(() => navItems.filter((item) => hasPermission(user.role, item.permission)), [user.role]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen lg:flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden border-r bg-card/95 backdrop-blur lg:flex lg:flex-col",
          collapsed ? "lg:w-20" : "lg:w-72"
        )}
      >
        <SidebarContent collapsed={collapsed} navItems={visibleNav} pathname={pathname} unreadCount={unreadCount} onToggle={() => setCollapsed((value) => !value)} />
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/45" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-80 max-w-[86vw] border-r bg-card shadow-command">
            <SidebarContent collapsed={false} navItems={visibleNav} pathname={pathname} unreadCount={unreadCount} onToggle={() => setMobileOpen(false)} mobile />
          </aside>
        </div>
      ) : null}

      <div className={cn("min-w-0 flex-1", collapsed ? "lg:pl-20" : "lg:pl-72")}>
        <Topbar user={user} unreadCount={unreadCount} onMenu={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarContent({
  collapsed,
  navItems: items,
  pathname,
  unreadCount,
  onToggle,
  mobile = false
}: {
  collapsed: boolean;
  navItems: NavItem[];
  pathname: string;
  unreadCount: number;
  onToggle: () => void;
  mobile?: boolean;
}) {
  return (
    <>
      {collapsed && !mobile ? (
        <div className="flex h-24 flex-col items-center justify-center gap-2 border-b">
          <Link href="/dashboard" aria-label="TransitOps dashboard">
            <TransitOpsMark className="h-11 w-11" />
          </Link>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Expand navigation" onClick={onToggle}>
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/dashboard" className="min-w-0" aria-label="TransitOps dashboard">
            <TransitOpsLogo />
          </Link>
          <Button variant="ghost" size="icon" aria-label={mobile ? "Close navigation" : "Collapse navigation"} onClick={onToggle}>
            {mobile ? <X className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.label : undefined}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                {!collapsed ? <span className="truncate">{item.label}</span> : null}
                {!collapsed && item.href === "/notifications" && unreadCount > 0 ? <Badge tone="critical">{unreadCount}</Badge> : null}
              </Link>
            );
          })}
        </div>
      </nav>
      {!collapsed ? (
        <div className="border-t p-4 text-xs text-muted-foreground">
          Dispatch-ready excludes on-trip, in-shop, and retired vehicles.
        </div>
      ) : null}
    </>
  );
}

function Topbar({ user, unreadCount, onMenu }: { user: Session["user"]; unreadCount: number; onMenu: () => void }) {
  const [quickOpen, setQuickOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const visibleQuick = quickCreate.filter((item) => hasPermission(user.role, item.permission));

  return (
    <header className="sticky top-0 z-30 border-b bg-background/88 backdrop-blur">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={onMenu}>
          <Menu className="h-5 w-5" />
        </Button>
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Button variant="outline" onClick={() => setQuickOpen((value) => !value)}>
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Quick Create</span>
            </Button>
            {quickOpen ? (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border bg-card p-2 shadow-command">
                {visibleQuick.map((item) => (
                  <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm hover:bg-muted" onClick={() => setQuickOpen(false)}>
                    {item.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          <ThemeToggle />
          <LinkButton href="/notifications" variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 ? <span className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-red-500" /> : null}
          </LinkButton>
          <div className="relative">
            <Button variant="ghost" onClick={() => setProfileOpen((value) => !value)} className="max-w-[190px]">
              <span className="hidden truncate sm:inline">{user.name}</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-64 rounded-lg border bg-card p-2 shadow-command">
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  <p className="mt-1 text-xs font-medium text-primary">{user.role}</p>
                </div>
                <button
                  className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
                  onClick={() => void signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("transitops-theme", next ? "dark" : "light");
  }

  return (
    <Button variant="ghost" size="icon" aria-label="Toggle theme" onClick={toggleTheme}>
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}

function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const json = (await response.json()) as { ok: boolean; data?: SearchResult[] };
        setResults(json.data ?? []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative min-w-0 flex-1 md:max-w-xl">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={inputRef}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Search vehicles, drivers, trips"
        className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
        aria-label="Global search"
      />
      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-12 z-50 max-h-[70vh] overflow-y-auto rounded-lg border bg-card p-2 shadow-command command-scrollbar">
          {loading ? <p className="px-3 py-4 text-sm text-muted-foreground">Searching...</p> : null}
          {!loading && results.length === 0 ? <p className="px-3 py-4 text-sm text-muted-foreground">No matching operations records found.</p> : null}
          {!loading && results.length > 0
            ? results.map((result) => (
                <button
                  key={`${result.group}-${result.id}`}
                  className="w-full rounded-md px-3 py-2 text-left hover:bg-muted"
                  onClick={() => {
                    setOpen(false);
                    setQuery("");
                    router.push(result.href);
                  }}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-primary">{result.group}</span>
                  <span className="mt-1 block text-sm font-medium">{result.title}</span>
                  <span className="block text-xs text-muted-foreground">{result.subtitle}</span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
}
