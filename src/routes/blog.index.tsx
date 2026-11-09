import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock } from "lucide-react";
import editorialImage from "@/assets/blog-editorial.jpg";
import { BlogShell } from "@/components/blog-shell";
import { Button } from "@/components/ui/button";
import { blogArticles, BLOG_SITE_URL } from "@/lib/blog";

const title = "TaskReddit Blog — Reddit missions, account quality & payments";
const description = "Practical guides to paid Reddit comments, TaskReddit account requirements, mission review and Talentir payments. Start with the facts before your first mission.";

export const Route = createFileRoute("/blog/")({
  head: () => ({ meta: [{ title }, { name: "description", content: description }, { property: "og:title", content: title }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { property: "og:url", content: `${BLOG_SITE_URL}/blog` }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: `${BLOG_SITE_URL}/blog` }] }),
  component: BlogIndex,
});

function BlogIndex() {
  return <BlogShell><main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
    <div className="mb-9 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-8">
      <div><p className="mb-3 text-sm font-medium text-primary">THE CONTRIBUTOR JOURNAL</p><h1 className="text-4xl font-bold tracking-normal sm:text-5xl">TaskReddit Blog</h1><p className="mt-4 max-w-xl text-base text-muted-foreground">Paid comments. Real accounts. Clear answers.</p></div>
      <span className="text-sm text-muted-foreground">Guides from the TaskReddit team</span>
    </div>
    <img src={editorialImage} alt="An orange speech bubble, green stamp and silver envelope representing comments, approval and payments" width={1536} height={1024} className="mb-10 aspect-[2/1] w-full rounded-lg object-cover sm:aspect-[3/1]" fetchPriority="high" />
    <section aria-label="Latest articles" className="grid gap-0 md:grid-cols-3 md:gap-8">
      {blogArticles.map((article, index) => <article key={article.slug} className="flex flex-col border-t border-border py-7">
        <div className="mb-5 flex items-center justify-between text-xs text-muted-foreground"><span className="font-medium text-primary">{article.category}</span><span>0{index + 1}</span></div>
        <h2 className="text-2xl font-semibold leading-snug tracking-normal"><Link to="/blog/$slug" params={{ slug: article.slug }} className="transition-colors hover:text-primary">{article.title}</Link></h2>
        <p className="mt-4 flex-1 text-sm leading-7 text-muted-foreground">{article.description}</p>
        <div className="mt-6 flex items-center justify-between"><span className="flex items-center gap-2 text-xs text-muted-foreground"><Clock className="h-3.5 w-3.5" />{article.readMinutes} min read</span><Button asChild variant="link" className="px-0"><Link to="/blog/$slug" params={{ slug: article.slug }}>Read article<ArrowUpRight className="h-4 w-4" /></Link></Button></div>
      </article>)}
    </section>
  </main></BlogShell>;
}