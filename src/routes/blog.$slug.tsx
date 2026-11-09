import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { BlogShell } from "@/components/blog-shell";
import { Button } from "@/components/ui/button";
import { blogArticles, BLOG_SITE_URL, getBlogArticle } from "@/lib/blog";

export const Route = createFileRoute("/blog/$slug")({
  loader: ({ params }) => { const article = getBlogArticle(params.slug); if (!article) throw notFound(); return article; },
  head: ({ loaderData: article }) => {
    if (!article) return { meta: [{ title: "Article unavailable — TaskReddit Blog" }, { name: "description", content: "This TaskReddit article is unavailable." }, { property: "og:title", content: "Article unavailable — TaskReddit Blog" }, { property: "og:description", content: "This TaskReddit article is unavailable." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" }] };
    const url = `${BLOG_SITE_URL}/blog/${article.slug}`;
    return { meta: [{ title: `${article.title} — TaskReddit Blog` }, { name: "description", content: article.description }, { property: "og:title", content: article.title }, { property: "og:description", content: article.description }, { property: "og:type", content: "article" }, { property: "og:url", content: url }, { property: "article:published_time", content: article.publishedAt }, { name: "twitter:card", content: "summary_large_image" }], links: [{ rel: "canonical", href: url }], scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "BlogPosting", headline: article.title, description: article.description, datePublished: article.publishedAt, dateModified: article.publishedAt, author: { "@type": "Organization", name: "TaskReddit", url: BLOG_SITE_URL }, publisher: { "@type": "Organization", name: "TaskReddit", url: BLOG_SITE_URL }, mainEntityOfPage: url }) }, { type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: BLOG_SITE_URL }, { "@type": "ListItem", position: 2, name: "Blog", item: `${BLOG_SITE_URL}/blog` }, { "@type": "ListItem", position: 3, name: article.title, item: url }] }) }] };
  },
  notFoundComponent: () => <BlogShell><main className="mx-auto max-w-3xl px-5 py-24"><h1 className="text-3xl font-bold tracking-normal">Article not found</h1><Button asChild variant="link" className="mt-5 px-0"><Link to="/blog"><ArrowLeft className="h-4 w-4" />Back to the blog</Link></Button></main></BlogShell>,
  component: ArticlePage,
});

function ArticlePage() {
  const article = Route.useLoaderData();
  return <BlogShell><main className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
    <Button asChild variant="link" className="mb-8 px-0 text-muted-foreground"><Link to="/blog"><ArrowLeft className="h-4 w-4" />All articles</Link></Button>
    <header className="max-w-3xl border-b border-border pb-9"><p className="mb-4 text-sm font-medium text-primary">{article.category}</p><h1 className="text-3xl font-bold leading-tight tracking-normal sm:text-5xl">{article.title}</h1><div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-muted-foreground"><span>By the TaskReddit team</span><time dateTime={article.publishedAt}>November 9, 2026</time><span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" />{article.readMinutes} min read</span></div></header>
    <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:gap-16">
      <article className="min-w-0 max-w-3xl">
        <p className="border-l-2 border-primary pl-5 text-lg leading-8">{article.summary}</p>
        <nav aria-label="In this article" className="mt-8 border-y border-border py-5 lg:hidden"><p className="mb-3 text-xs font-medium text-primary">IN THIS ARTICLE</p><ul className="space-y-2">{article.sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="text-sm text-muted-foreground hover:text-foreground">{section.title}</a></li>)}</ul></nav>
        {article.sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-8 pt-10"><h2 className="mb-4 text-2xl font-semibold leading-snug tracking-normal">{section.title}</h2>{section.paragraphs.map(paragraph => <p key={paragraph} className="mb-4 text-base leading-8 text-muted-foreground">{paragraph}</p>)}{section.bullets && <ul className="mt-4 list-disc space-y-3 pl-5 text-base leading-7 text-muted-foreground marker:text-primary">{section.bullets.map(bullet => <li key={bullet}>{bullet}</li>)}</ul>}</section>)}
        <div className="mt-12 border-y border-border py-8"><h2 className="text-2xl font-semibold tracking-normal">Find your next comment mission</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">Check the available opportunities. An accepted account and an active reservation are required before completing a mission.</p><div className="mt-5 flex flex-wrap gap-3"><Button asChild><Link to="/discover">Browse missions<ArrowRight className="h-4 w-4" /></Link></Button><Button asChild variant="outline"><Link to="/auth">Create an account</Link></Button></div></div>
        <section className="mt-10"><h2 className="mb-5 text-xl font-semibold tracking-normal">Keep reading</h2>{blogArticles.filter(other => other.slug !== article.slug).map(other => <Button key={other.slug} asChild variant="link" className="mb-2 h-auto w-full justify-between whitespace-normal px-0 py-3 text-left"><Link to="/blog/$slug" params={{ slug: other.slug }}>{other.title}<ArrowRight className="h-4 w-4 shrink-0" /></Link></Button>)}</section>
      </article>
      <aside className="sticky top-8 hidden border-l border-border pl-6 lg:block"><p className="mb-5 text-xs font-medium text-primary">IN THIS ARTICLE</p><nav aria-label="Table of contents"><ul className="space-y-4">{article.sections.map(section => <li key={section.id}><a href={`#${section.id}`} className="text-sm leading-6 text-muted-foreground transition-colors hover:text-foreground">{section.title}</a></li>)}</ul></nav></aside>
    </div>
  </main></BlogShell>;
}