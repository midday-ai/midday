import { DocsMDX } from "@/components/docs/mdx";
import { DocsSidebarToggle } from "@/components/docs/sidebar-toggle";
import { docsNavigation, getAllDocSlugs, getDocBySlug } from "@/lib/docs";
import { Icons } from "@midday/ui/icons";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const slugs = getAllDocSlugs();
  return slugs.map((slug) => ({ slug }));
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: { params: Params }): Promise<Metadata | undefined> {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    return;
  }

  return {
    title: doc.metadata.title,
    description: doc.metadata.description,
    openGraph: {
      title: doc.metadata.title,
      description: doc.metadata.description,
      type: "article",
      url: `https://midday.ai/docs/${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: doc.metadata.title,
      description: doc.metadata.description,
    },
  };
}

function getAdjacentDocs(currentSlug: string) {
  const allDocs: Array<{ slug: string; title: string }> = [];

  for (const section of docsNavigation) {
    for (const doc of section.docs) {
      allDocs.push({ slug: doc.slug, title: doc.title });
    }
  }

  const currentIndex = allDocs.findIndex((d) => d.slug === currentSlug);

  return {
    prev: currentIndex > 0 ? allDocs[currentIndex - 1] : null,
    next: currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null,
  };
}

export default async function DocPage({ params }: { params: Params }) {
  const { slug } = await params;
  const doc = getDocBySlug(slug);

  if (!doc) {
    notFound();
  }

  const { prev, next } = getAdjacentDocs(slug);

  return (
    <div className="min-h-[calc(100vh-200px)] pt-24 md:pt-32">
      <DocsSidebarToggle navigation={docsNavigation} />

      <div className="max-w-2xl mx-auto px-4 pb-24">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground mb-12">
          <Link
            href="/docs"
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <span>/</span>
          <span className="text-foreground">{doc.metadata.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-foreground mb-4">
            {doc.metadata.title}
          </h1>
          {doc.metadata.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {doc.metadata.description}
            </p>
          )}
        </header>

        {/* Content */}
        <article>
          <DocsMDX source={doc.content} />
        </article>

        {/* Navigation */}
        <nav className="mt-20 pt-8 border-t border-border">
          <div className="flex items-center justify-between gap-4">
            {prev ? (
              <Link
                href={`/docs/${prev.slug}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icons.ArrowBack className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="truncate">{prev.title}</span>
              </Link>
            ) : (
              <div />
            )}

            {next ? (
              <Link
                href={`/docs/${next.slug}`}
                className="group flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors text-right"
              >
                <span className="truncate">{next.title}</span>
                <Icons.ArrowForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <div />
            )}
          </div>
        </nav>

        {/* Back to assistant */}
        <div className="mt-12 pt-8 border-t border-border text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Have a question? Ask the assistant</span>
            <Icons.ArrowForward className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
