import { cn } from "@midday/ui/cn";
import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  basePath: string;
};

function getPageUrl(basePath: string, page: number): string {
  // Page 1 goes to base path, other pages go to /page/[page]
  return page === 1 ? basePath : `${basePath}/page/${page}`;
}

export function Pagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-2 mt-16 mb-8">
      {currentPage > 1 && (
        <Link
          href={getPageUrl(basePath, currentPage - 1)}
          className="px-3 py-2 text-sm text-[#878787] hover:text-foreground transition-colors"
        >
          Previous
        </Link>
      )}

      <div className="flex items-center gap-1">
        {pages.map((page) => {
          const isCurrentPage = page === currentPage;
          const href = getPageUrl(basePath, page);

          return (
            <Link
              key={page}
              href={href}
              className={cn(
                "w-8 h-8 flex items-center justify-center text-sm rounded-full transition-colors",
                isCurrentPage
                  ? "bg-primary text-primary-foreground"
                  : "text-[#878787] hover:text-foreground hover:bg-accent",
              )}
            >
              {page}
            </Link>
          );
        })}
      </div>

      {currentPage < totalPages && (
        <Link
          href={getPageUrl(basePath, currentPage + 1)}
          className="px-3 py-2 text-sm text-[#878787] hover:text-foreground transition-colors"
        >
          Next
        </Link>
      )}
    </nav>
  );
}
