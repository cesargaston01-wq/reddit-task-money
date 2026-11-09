import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function BlogShell({ children }: { children: ReactNode }) {
  return <div className="min-h-screen bg-background text-foreground">
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4">
        <Button asChild variant="ghost" className="px-0 font-display text-lg"><Link to="/"><img src="/taskreddit-logo.png" alt="" width={28} height={28} />Task<span className="text-primary">Reddit</span></Link></Button>
        <nav aria-label="Blog navigation" className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm"><Link to="/blog">Blog</Link></Button>
          <Button asChild size="sm"><Link to="/discover">View missions<ArrowRight className="h-4 w-4" /></Link></Button>
        </nav>
      </div>
    </header>
    {children}
    <footer className="mt-16 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-8 text-sm text-muted-foreground">
        <span>TaskReddit · Contributor journal</span>
        <div className="flex gap-3"><Button asChild variant="link" size="sm"><Link to="/">Home</Link></Button><Button asChild variant="link" size="sm"><Link to="/auth">Create an account</Link></Button></div>
      </div>
    </footer>
  </div>;
}