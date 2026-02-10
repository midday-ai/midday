import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearch,
} from "@tanstack/react-router";
import * as React from "react";
import { z } from "zod";
import { AppSidebar, type NavItem } from "@/components/app-sidebar";
import { CommandPalette } from "@/components/layout/command-palette";
import { HeaderSearch } from "@/components/layout/header-search";
import { useConfig, useQueueNames, useQueues } from "@/lib/hooks";
import { FlowPage } from "@/pages/flow";
import { FlowsPage } from "@/pages/flows";
import { JobPage } from "@/pages/job";
import { MetricsPage } from "@/pages/metrics";
import { QueuePage } from "@/pages/queue";
import { RunsPage } from "@/pages/runs";
import { SchedulersPage } from "@/pages/schedulers";
import { TestPage } from "@/pages/test";

// Context for sharing search state across routes
interface SearchContextValue {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setCommandOpen: (open: boolean) => void;
}

const SearchContext = React.createContext<SearchContextValue | null>(null);

export function useSearchContext() {
  const context = React.useContext(SearchContext);
  if (!context) {
    throw new Error(
      "useSearchContext must be used within SearchContextProvider",
    );
  }
  return context;
}

// Search params schema for the Runs page
// sort format: "field:direction" e.g. "timestamp:desc"
export const runsSearchSchema = z.object({
  status: z
    .enum(["all", "active", "completed", "failed", "waiting", "delayed"])
    .optional()
    .catch("all"),
  q: z.string().optional().catch(""),
  from: z.number().optional(),
  to: z.number().optional(),
  sort: z.string().optional(), // format: "field:direction"
});

export type RunsSearch = z.infer<typeof runsSearchSchema>;

// Search params schema for the Queue page
export const queueSearchSchema = z.object({
  status: z
    .enum(["all", "active", "completed", "failed", "waiting", "delayed"])
    .optional()
    .catch("all"),
  sort: z.string().optional(), // format: "field:direction"
});

export type QueueSearch = z.infer<typeof queueSearchSchema>;

// Search params schema for the Schedulers page
export const schedulersSearchSchema = z.object({
  tab: z.enum(["repeatable", "delayed"]).optional().catch("repeatable"),
  repeatableSort: z.string().optional(), // format: "field:direction"
  delayedSort: z.string().optional(), // format: "field:direction"
});

export type SchedulersSearch = z.infer<typeof schedulersSearchSchema>;

// Search params schema for the Job page
export const jobSearchSchema = z.object({
  tab: z.enum(["payload", "output", "error", "retries", "timeline"]).optional(),
});

export type JobSearch = z.infer<typeof jobSearchSchema>;

// Search params schema for the Test page (for cloning jobs)
export const testSearchSchema = z.object({
  queue: z.string().optional(),
  jobName: z.string().optional(),
  payload: z.string().optional(),
});

export type TestSearch = z.infer<typeof testSearchSchema>;

// Helper to parse sort string
export function parseSort(
  sort?: string,
): { field: string; direction: "asc" | "desc" } | undefined {
  if (!sort) return undefined;
  const [field, dir] = sort.split(":");
  if (!field) return undefined;
  return { field, direction: dir === "asc" ? "asc" : "desc" };
}

// Helper to create sort string
export function createSort(field: string, direction: "asc" | "desc"): string {
  return `${field}:${direction}`;
}

// Root layout component
function RootLayout() {
  const { data: config, isLoading: loading } = useConfig();
  // Use fast queue names for sidebar (no counts, instant)
  const { data: queueNames = [] } = useQueueNames();
  // Lazy load full queue info for paused state (loads in background)
  const { data: queuesData = [] } = useQueues();
  const navigate = useNavigate();

  // Derive paused queues set (from lazy-loaded full queue data)
  const pausedQueues = React.useMemo(() => {
    return new Set(queuesData.filter((q) => q.isPaused).map((q) => q.name));
  }, [queuesData]);
  const location = useLocation();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isDark, setIsDark] = React.useState(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("workbench:theme");
      if (stored) return stored === "dark";
      return window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    return false;
  });

  // Derive active nav and queue from location
  const { activeNav, activeQueue } = React.useMemo(() => {
    const path = location.pathname;
    if (path === "/" || path === "") {
      return { activeNav: "runs" as NavItem, activeQueue: undefined };
    }
    if (path === "/metrics") {
      return { activeNav: "metrics" as NavItem, activeQueue: undefined };
    }
    if (path === "/schedulers") {
      return { activeNav: "schedulers" as NavItem, activeQueue: undefined };
    }
    if (path === "/flows" || path.startsWith("/flows/")) {
      return { activeNav: "flows" as NavItem, activeQueue: undefined };
    }
    if (path === "/test") {
      return { activeNav: "test" as NavItem, activeQueue: undefined };
    }
    if (path.startsWith("/queues/")) {
      const queueName = path.split("/")[2];
      return { activeNav: "queues" as NavItem, activeQueue: queueName };
    }
    return { activeNav: "runs" as NavItem, activeQueue: undefined };
  }, [location.pathname]);

  // Toggle dark mode (disable transitions during switch)
  React.useEffect(() => {
    document.documentElement.classList.add("no-transitions");
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("workbench:theme", isDark ? "dark" : "light");
    // Re-enable transitions after the theme switch
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove("no-transitions");
      });
    });
  }, [isDark]);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette shortcut
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen(true);
        return;
      }
      // Don't handle other shortcuts when command palette is open (let cmdk handle them)
      if (commandOpen) return;
      // Refresh shortcut
      if (e.key === "r" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        window.location.reload();
      }
      // Theme toggle shortcut
      if (e.key === "t" && (e.metaKey || e.ctrlKey) && e.shiftKey) {
        e.preventDefault();
        setIsDark(!isDark);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [commandOpen, isDark]);

  if (loading || !config) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleNavSelect = (nav: NavItem) => {
    switch (nav) {
      case "runs":
        navigate({ to: "/" });
        break;
      case "metrics":
        navigate({ to: "/metrics" });
        break;
      case "schedulers":
        navigate({ to: "/schedulers" });
        break;
      case "flows":
        navigate({ to: "/flows" });
        break;
      case "test":
        navigate({ to: "/test" });
        break;
      case "queues":
        // Just expand the queues section, don't navigate
        break;
    }
  };

  const handleQueueSelect = (queue: string) => {
    navigate({ to: "/queues/$queueName", params: { queueName: queue } });
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar
        queues={config.queues}
        pausedQueues={pausedQueues}
        activeNav={activeNav}
        activeQueue={activeQueue}
        onNavSelect={handleNavSelect}
        onQueueSelect={handleQueueSelect}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <SearchContext.Provider
          value={{ searchQuery, setSearchQuery, setCommandOpen }}
        >
          <Outlet />
        </SearchContext.Provider>
      </div>

      <CommandPalette
        open={commandOpen}
        onOpenChange={setCommandOpen}
        queues={config.queues}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onSelectQueue={(queue) => {
          navigate({ to: "/queues/$queueName", params: { queueName: queue } });
          setCommandOpen(false);
        }}
        onSelectJob={(queue, jobId) => {
          navigate({
            to: "/queues/$queueName/jobs/$jobId",
            params: { queueName: queue, jobId },
          });
          setCommandOpen(false);
        }}
        onNavigate={(path) => {
          navigate({ to: path });
          setCommandOpen(false);
        }}
      />
    </div>
  );
}

// Page wrapper with header
function PageLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  const context = useSearchContext();

  return (
    <>
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-6">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold">{title}</h1>
          {subtitle && (
            <span className="font-mono text-sm text-muted-foreground">
              {subtitle}
            </span>
          )}
        </div>
        <HeaderSearch
          value={context.searchQuery}
          onValueChange={context.setSearchQuery}
          onFocus={() => context.setCommandOpen(true)}
        />
      </header>
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </>
  );
}

// Route components - all pages eagerly loaded for instant navigation
function RunsRoute() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/" });

  return (
    <PageLayout title="Runs">
      <RunsPage
        search={search}
        onSearchChange={(newSearch) => {
          navigate({
            to: "/",
            search: newSearch,
            replace: true,
          });
        }}
        onJobSelect={(queueName, jobId) =>
          navigate({
            to: "/queues/$queueName/jobs/$jobId",
            params: { queueName, jobId },
          })
        }
        onQueueSelect={(queueName) =>
          navigate({
            to: "/queues/$queueName",
            params: { queueName },
          })
        }
      />
    </PageLayout>
  );
}

function SchedulersRoute() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/schedulers" }) as SchedulersSearch;

  return (
    <PageLayout title="Schedulers">
      <SchedulersPage
        search={search}
        onSearchChange={(newSearch: SchedulersSearch) => {
          navigate({
            to: "/schedulers",
            search: newSearch,
            replace: true,
          });
        }}
      />
    </PageLayout>
  );
}

function MetricsRoute() {
  return (
    <PageLayout title="Metrics">
      <MetricsPage />
    </PageLayout>
  );
}

function FlowsRoute() {
  const navigate = useNavigate();
  return (
    <PageLayout title="Flows">
      <FlowsPage
        onFlowSelect={(queueName, jobId) =>
          navigate({
            to: "/flows/$queueName/$jobId",
            params: { queueName, jobId },
          })
        }
      />
    </PageLayout>
  );
}

function FlowDetailRoute() {
  const { queueName, jobId } = useParams({ from: "/flows/$queueName/$jobId" });
  return (
    <PageLayout title="Flow Details" subtitle={jobId}>
      <FlowPage queueName={queueName} jobId={jobId} />
    </PageLayout>
  );
}

function TestRoute() {
  const { data: config } = useConfig();
  const search = useSearch({ from: "/test" });
  return (
    <PageLayout title="Test">
      <TestPage
        queues={config?.queues || []}
        readonly={config?.readonly}
        prefill={search}
      />
    </PageLayout>
  );
}

function QueueRoute() {
  const { queueName } = useParams({ from: "/queues/$queueName" });
  const navigate = useNavigate();
  const search = useSearch({ from: "/queues/$queueName" });

  return (
    <PageLayout title={queueName}>
      <QueuePage
        queueName={queueName}
        search={search}
        onSearchChange={(newSearch) => {
          navigate({
            to: "/queues/$queueName",
            params: { queueName },
            search: newSearch,
            replace: true,
          });
        }}
        onJobSelect={(jobId) =>
          navigate({
            to: "/queues/$queueName/jobs/$jobId",
            params: { queueName, jobId },
          })
        }
      />
    </PageLayout>
  );
}

function JobRoute() {
  const { queueName, jobId } = useParams({
    from: "/queues/$queueName/jobs/$jobId",
  });
  const { data: config } = useConfig();
  const navigate = useNavigate();
  const search = useSearch({ from: "/queues/$queueName/jobs/$jobId" });

  return (
    <PageLayout title="Job Details" subtitle={jobId}>
      <JobPage
        queueName={queueName}
        jobId={jobId}
        readonly={config?.readonly}
        search={search}
        onSearchChange={(newSearch) => {
          navigate({
            to: "/queues/$queueName/jobs/$jobId",
            params: { queueName, jobId },
            search: newSearch,
            replace: true,
          });
        }}
        onBack={() =>
          navigate({ to: "/queues/$queueName", params: { queueName } })
        }
        onClone={(queue, jobName, payload) =>
          navigate({
            to: "/test",
            search: { queue, jobName, payload },
          })
        }
      />
    </PageLayout>
  );
}

// Route definitions
const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: RunsRoute,
  validateSearch: runsSearchSchema,
});

const metricsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/metrics",
  component: MetricsRoute,
});

const schedulersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedulers",
  component: SchedulersRoute,
  validateSearch: schedulersSearchSchema,
});

const flowsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/flows",
  component: FlowsRoute,
});

const flowDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/flows/$queueName/$jobId",
  component: FlowDetailRoute,
});

const testRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/test",
  component: TestRoute,
  validateSearch: testSearchSchema,
});

const queueRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/queues/$queueName",
  component: QueueRoute,
  validateSearch: queueSearchSchema,
});

const jobRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/queues/$queueName/jobs/$jobId",
  component: JobRoute,
  validateSearch: jobSearchSchema,
});

// Route tree
const routeTree = rootRoute.addChildren([
  indexRoute,
  metricsRoute,
  schedulersRoute,
  flowsRoute,
  flowDetailRoute,
  testRoute,
  queueRoute,
  jobRoute,
]);

// Create and export router
export function createAppRouter(basePath: string) {
  return createRouter({
    routeTree,
    basepath: basePath,
  });
}

// Type declaration for router
declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
}
