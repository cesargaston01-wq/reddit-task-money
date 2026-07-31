import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  History,
  LogOut,
  MessageSquare,
  Shield,
  User as UserIcon,
  Menu,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useIsAdmin, useProfile } from "@/lib/data";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/opportunities/posts", label: "Post opportunities", icon: FileText },
  { to: "/opportunities/comments", label: "Comment opportunities", icon: MessageSquare },
  { to: "/history", label: "My missions", icon: History },
  { to: "/profile", label: "Profile", icon: UserIcon },
] as const;

export function DashboardLayout({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: isAdmin } = useIsAdmin();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const links = [
    ...nav,
    ...(isAdmin ? ([{ to: "/admin", label: "Administration", icon: Shield }] as const) : []),
  ];

  return (
    <div className="flex min-h-screen w-full">
      {open ? (
        <div
          className="fixed inset-0 z-30 bg-background/70 backdrop-blur-sm md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 max-w-[80vw] shrink-0 border-r border-sidebar-border bg-sidebar transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >

        <div className="flex h-16 items-center px-5">
          <Link to="/" className="font-display text-base font-bold">
            Task<span className="text-primary">Reddit</span>
          </Link>
        </div>
        <nav className="space-y-1 px-3">
          {links.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute inset-x-0 bottom-0 space-y-3 border-t border-sidebar-border p-4">
          <div className="truncate text-xs text-muted-foreground">{profile?.email}</div>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col md:pl-64">
        <header className="flex h-16 items-center gap-3 border-b border-border px-5 md:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen((v) => !v)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold">TaskReddit</span>
        </header>
        <main className="flex-1 px-5 py-8 md:px-10">
          <div className="mx-auto max-w-5xl">
            <h1 className="text-2xl font-bold">{title}</h1>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
            <div className="mt-8">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
