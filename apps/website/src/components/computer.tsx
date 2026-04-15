"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

function InfraDiagram() {
  const d = (text: string) => (
    <span className="text-muted-foreground">{text}</span>
  );
  return (
    <>
      {
        "  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐\n"
      }
      {
        "  │  Dashboard   │  │     Chat     │  │     CLI      │  │     API      │\n"
      }
      {
        "  └──────┬───────┘  └──────┬───────┘  └───────┬──────┘  └───────┬──────┘\n"
      }
      {"         │                 │                  │                 │\n"}
      {"         └─────────────────┴──────────────────┴─────────────────┘\n"}
      {"                                    │\n"}
      {"                             describe / trigger\n"}
      {"                                    │\n"}
      {
        " ┌──────────────────────────────────┴──────────────────────────────────┐\n"
      }
      {" │"}
      {d(
        "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
      )}
      {"│\n"}
      {" │"}
      {d("░░░░░░░░░░░░░░░░░░░░░░░░░░░")}
      {"  Midday Computer  "}
      {d("░░░░░░░░░░░░░░░░░░░░░░░")}
      {"│\n"}
      {" │"}
      {d(
        "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
      )}
      {"│\n"}
      {" │"}
      {d("░░░░░░░░░░░░░░░░░░")}
      {"  generate · schedule · execute  "}
      {d("░░░░░░░░░░░░░░░░░░")}
      {"│\n"}
      {" │"}
      {d(
        "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
      )}
      {"│\n"}
      {
        " └──────┬──────────────┬───────────────┬───────────────┬───────────────┘\n"
      }
      {"        │              │               │               │\n"}
      {"        ▼              ▼               ▼               ▼\n"}
      {"\n"}
      {
        "   ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐\n"
      }
      {
        "   │  100+    │  │    Agent     │  │ Notifications│  │   External   │\n"
      }
      {
        "   │  MCP     │  │    Memory    │  │              │  │  Connectors  │\n"
      }
      {
        "   │  Tools   │  │              │  │              │  │              │\n"
      }
      {
        "   └──────────┘  └──────────────┘  └──────────────┘  └──────────────┘\n"
      }
    </>
  );
}

function SectionDivider() {
  return (
    <div className="w-full py-1">
      <div
        className="h-4 w-full border-y border-border"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-60deg, hsla(var(--border), 0.4), hsla(var(--border), 0.4) 1px, transparent 1px, transparent 6px)",
        }}
      />
    </div>
  );
}

function CopyInstall() {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("npx @midday-ai/cli@latest computer");
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      type="button"
      onClick={copyCommand}
      className="flex border border-border p-2 px-4 text-sm w-full relative cursor-pointer hover:bg-[hsl(0,0%,12%)] transition-colors"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-60deg, hsla(var(--border), 0.4), hsla(var(--border), 0.4) 1px, transparent 1px, transparent 6px)",
      }}
    >
      <span className="text-foreground truncate">
        $ npx @midday-ai/cli@latest computer
      </span>

      <div className="flex items-center space-x-2 ml-auto">
        {copied ? (
          <Icons.Check size={14} className="text-foreground" />
        ) : (
          <Icons.Copy size={14} className="text-foreground" />
        )}
      </div>

      {copied && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 text-xs text-foreground animate-in fade-in slide-in-from-bottom-1">
          Copied
        </div>
      )}
    </button>
  );
}

const ORA_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

type Phase =
  | "typing-1"
  | "spin-1"
  | "result-1"
  | "typing-2"
  | "spin-2"
  | "result-2"
  | "done";

const PHASES: Phase[] = [
  "typing-1",
  "spin-1",
  "result-1",
  "typing-2",
  "spin-2",
  "result-2",
  "done",
];

type Scenario = {
  label: string;
  cmd1: string;
  cmd2: string;
  spin1: string;
  spin2: string;
  done2: string;
  result1: React.ReactNode;
  result2Line: React.ReactNode;
};

const g = (text: string) => <span className="text-foreground">{text}</span>;

const SCENARIOS: Scenario[] = [
  {
    label: "Create agent",
    cmd1: 'midday computer create "close my books at the end of every month"',
    cmd2: "midday computer confirm",
    spin1: "Generating agent...",
    spin2: "Deploying agent...",
    done2: "Deploying agent...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-foreground/20 text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-foreground">
          Agent plan
        </span>
        <div className="p-3 pt-2 space-y-0.5">
          <div>
            Name: <span className="text-foreground">Month-End Close</span>
          </div>
          <div>
            Schedule:{" "}
            <span className="text-foreground">28th–31st at 8:00 AM</span>
          </div>
          <div>
            What it does:{" "}
            <span className="text-foreground">
              Reviews transactions, flags issues, compares to last month
            </span>
          </div>
          <div className="pt-1 text-[11px] text-muted-foreground">
            Run `midday computer confirm` to deploy.
          </div>
        </div>
      </div>
    ),
    result2Line: (
      <div className="mt-1 text-foreground text-[12px]">
        {g("✓")} Agent deployed. First run: April 28th at 8:00 AM
      </div>
    ),
  },
  {
    label: "Weekly briefing",
    cmd1: "midday computer run weekly-briefing --wait",
    cmd2: "midday computer memory weekly-briefing",
    spin1: "Running Weekly Briefing...",
    spin2: "Fetching memory...",
    done2: "Fetching memory...",
    result1: (
      <div className="mt-2 text-foreground text-[12px] space-y-0.5">
        <div>{g("✓")} Run complete</div>
        <div> Cash position: $142,800 across 2 accounts</div>
        <div> Revenue (MTD): $28,400 (+8.2% vs last week)</div>
        <div> Overdue invoices: 2 totaling $4,200</div>
        <div> Top expense: Software subscriptions $3,840</div>
        <div> Action: Follow up on INV-0091, INV-0087</div>
      </div>
    ),
    result2Line: (
      <div className="mt-1 text-foreground text-[12px] space-y-0.5">
        <div> [Apr 7] Revenue trending +8% week over week</div>
        <div> [Mar 31] Q1 close complete, 3 items flagged</div>
        <div> [Mar 24] Contractor spend within budget</div>
      </div>
    ),
  },
  {
    label: "Chase invoices",
    cmd1: "midday computer proposals invoice-chaser",
    cmd2: "midday computer approve invoice-chaser run_182",
    spin1: "Fetching proposals...",
    spin2: "Sending reminders...",
    done2: "Sending reminders...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-foreground/20 text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-foreground">
          Waiting for your approval
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-foreground/20">
              <th className="font-normal pl-3 pr-2 pb-1 text-foreground">
                ACTION
              </th>
              <th className="font-normal pr-2 pb-1 text-foreground">INVOICE</th>
              <th className="font-normal pr-3 pb-1 text-right text-foreground">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Send reminder</td>
              <td className="pr-2 py-[3px]">INV-0091 (Acme Corp)</td>
              <td className="pr-3 py-[3px] text-right">$2,340.00</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Send reminder</td>
              <td className="pr-2 py-[3px]">INV-0087 (Northwind)</td>
              <td className="pr-3 py-[3px] text-right">$1,860.00</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
    result2Line: (
      <div className="mt-1 text-foreground text-[12px]">
        {g("✓")} 2 reminders sent. $4,200 in overdue invoices followed up.
      </div>
    ),
  },
  {
    label: "Expense alert",
    cmd1: "midday computer run expense-detector --wait",
    cmd2: "midday computer logs expense-detector",
    spin1: "Running Expense Detector...",
    spin2: "Fetching run history...",
    done2: "Fetching run history...",
    result1: (
      <div className="mt-2 text-foreground text-[12px] space-y-0.5">
        <div>{g("⚠")} Anomaly detected</div>
        <div> Shopify: $4,120 (3.2x your daily average)</div>
        <div> Possible duplicate: AWS $189 charged twice</div>
        <div> New vendor: DesignStudio.co ($950)</div>
        <div> Notification sent to your team</div>
      </div>
    ),
    result2Line: (
      <div className="mt-1 text-foreground text-[12px] space-y-0.5">
        <div> [Apr 15] 3 anomalies flagged (notified)</div>
        <div> [Apr 14] No anomalies. All clear.</div>
        <div> [Apr 13] No anomalies. All clear.</div>
        <div> [Apr 12] 1 duplicate charge flagged</div>
      </div>
    ),
  },
];

function Terminal() {
  const [activeTab, setActiveTab] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing-1");
  const [typed1, setTyped1] = useState("");
  const [typed2, setTyped2] = useState("");
  const [frame, setFrame] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const termRef = useRef<HTMLDivElement>(null);

  const scenario = SCENARIOS[activeTab] as Scenario;

  const resetAnimation = useCallback(() => {
    setPhase("typing-1");
    setTyped1("");
    setTyped2("");
    setFrame(0);
  }, []);

  useEffect(() => {
    resetAnimation();
  }, [activeTab, resetAnimation]);

  const handleTabClick = (idx: number) => {
    setActiveTab(idx);
  };

  const past = (p: Phase) => PHASES.indexOf(phase) >= PHASES.indexOf(p);

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (phase !== "typing-1") return;
    let i = 0;
    const id = setInterval(() => {
      if (i <= scenario.cmd1.length) {
        setTyped1(scenario.cmd1.slice(0, i));
        i++;
      } else {
        clearInterval(id);
        setTimeout(() => setPhase("spin-1"), 300);
      }
    }, 40);
    return () => clearInterval(id);
  }, [phase, scenario.cmd1]);

  useEffect(() => {
    if (phase !== "spin-1" && phase !== "spin-2") return;
    const id = setInterval(
      () => setFrame((f) => (f + 1) % ORA_FRAMES.length),
      80,
    );
    const dur = phase === "spin-1" ? 2000 : 1400;
    const t = setTimeout(() => {
      clearInterval(id);
      setPhase(phase === "spin-1" ? "result-1" : "result-2");
    }, dur);
    return () => {
      clearInterval(id);
      clearTimeout(t);
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== "result-1") return;
    const t = setTimeout(() => setPhase("typing-2"), 1500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "typing-2") return;
    let i = 0;
    const id = setInterval(() => {
      if (i <= scenario.cmd2.length) {
        setTyped2(scenario.cmd2.slice(0, i));
        i++;
      } else {
        clearInterval(id);
        setTimeout(() => setPhase("spin-2"), 300);
      }
    }, 40);
    return () => clearInterval(id);
  }, [phase, scenario.cmd2]);

  useEffect(() => {
    if (phase !== "result-2") return;
    const t = setTimeout(() => setPhase("done"), 800);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % SCENARIOS.length);
    }, 2500);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    setTimeout(() => {
      termRef.current?.scrollTo({
        top: termRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 30);
  }, [phase, typed1, typed2, frame]);

  const cursor = (
    <span
      className={cn(
        "inline-block w-[7px] h-[15px] ml-px align-middle bg-foreground",
        cursorOn ? "opacity-100" : "opacity-0",
      )}
    />
  );

  const prompt = <span className="text-foreground">~ $ </span>;

  const spin = (text: string) => (
    <div className="text-foreground">
      {ORA_FRAMES[frame]} {text}
    </div>
  );

  return (
    <div className="max-w-3xl w-full font-mono">
      <div className="overflow-hidden border border-border">
        <div className="select-none flex items-center h-7 px-3 border-b border-border bg-[hsl(0,0%,10%)]">
          <div className="flex gap-[5px]">
            <span className="block w-2 h-2 rounded-full bg-[hsl(0,0%,25%)]" />
            <span className="block w-2 h-2 rounded-full bg-[hsl(0,0%,25%)]" />
            <span className="block w-2 h-2 rounded-full bg-[hsl(0,0%,25%)]" />
          </div>
          <span className="flex-1 text-center text-[10px] tracking-wide text-foreground -ml-10">
            midday computer — zsh
          </span>
        </div>

        <div className="flex bg-muted/40">
          {SCENARIOS.map((s, i) => (
            <button
              key={s.label}
              type="button"
              onClick={() => handleTabClick(i)}
              className={cn(
                "relative flex-1 px-4 py-1.5 text-[11px] tracking-wide transition-colors border-b",
                i === activeTab
                  ? "bg-background text-foreground border-b-transparent"
                  : "text-[hsl(0,0%,55%)] hover:text-foreground border-b-border",
                i > 0 && "border-l border-l-border",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div
          ref={termRef}
          className="overflow-y-auto h-[380px] md:h-[460px] scroll-smooth p-5 bg-background text-[13px] leading-[1.7] text-foreground"
        >
          <div className="text-[hsl(0,0%,55%)] text-[10px] tracking-widest mb-5">
            midday computer v0.1.0 · agent@acme.corp
          </div>

          <div>
            {prompt}
            {typed1}
            {phase === "typing-1" && cursor}
          </div>

          {phase === "spin-1" && (
            <div className="mt-1">{spin(scenario.spin1)}</div>
          )}

          {past("result-1") && scenario.result1}

          {past("typing-2") && (
            <div className="mt-2">
              {prompt}
              {typed2}
              {phase === "typing-2" && cursor}
            </div>
          )}

          {phase === "spin-2" && (
            <div className="mt-1">{spin(scenario.spin2)}</div>
          )}

          {past("result-2") && (
            <div className="mt-1">{scenario.result2Line}</div>
          )}

          {phase === "done" && (
            <div className="mt-3">
              {prompt}
              {cursor}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    title: "You describe, it builds",
    description:
      "Tell Midday what you need in plain English. It builds the agent, shows you the plan, and deploys when you're ready.",
  },
  {
    title: "Ready-made agents",
    description:
      "Month-End Close, Invoice Chaser, Weekly Briefing, Expense Detector. Enable in one click. Already tuned for real workflows.",
  },
  {
    title: "Runs on your schedule",
    description:
      "Every Tuesday at 9 AM. Last day of the month. Daily at 10. Set it once and your agents handle the rest.",
  },
  {
    title: "Learns over time",
    description:
      "Agents remember across runs. Trends compound weekly. Baselines sharpen. The longer they run, the more useful they get.",
  },
  {
    title: "You stay in control",
    description:
      "Agents propose actions, you review and approve. Nothing happens without your say. Built for trust.",
  },
  {
    title: "Access to all your data",
    description:
      "Invoices, transactions, customers, reports, bank accounts, and more. Agents work with everything Midday knows about your business.",
  },
  {
    title: "Thinks, not just executes",
    description:
      "Agents analyze your data, spot anomalies, compare trends, and make recommendations. Not just automation.",
  },
  {
    title: "Secure and isolated",
    description:
      "Every agent runs in its own sandbox with no access to your filesystem or network. Hard limits on what it can do.",
  },
  {
    title: "See everything it does",
    description:
      "Full trace of every step. What data it read, what it decided, what actions it took. Nothing is a black box.",
  },
  {
    title: "Connected to your tools",
    description:
      "Post results to Slack, send emails via Gmail, update Google Sheets. Agents deliver wherever your team works.",
  },
  {
    title: "Works wherever you are",
    description:
      "Dashboard, iMessage, chat, or CLI. Create agents, approve proposals, and check results from any surface.",
  },
  {
    title: "Up and running in seconds",
    description:
      "One command. Sign in with your browser. No API keys, no config files. Your first agent is live in under a minute.",
  },
];

const catalogAgents = [
  {
    name: "Month-End Close",
    schedule: "Last days of month, 8 AM",
    description:
      "Runs through your books so you don't have to. Flags what needs attention before you close the month.",
    details: [
      "Reviews every transaction for the current month",
      "Flags uncategorized items and pending inbox documents",
      "Compares spending to last month and gives you a health check",
    ],
  },
  {
    name: "Invoice Chaser",
    schedule: "Tuesdays 9 AM",
    description:
      "Finds overdue invoices and proposes sending reminders. You approve before anything goes out.",
    details: [
      "Prioritizes by amount and how long invoices have been outstanding",
      "Tracks escalation history so repeat late payers get flagged",
      "Proposes reminders for you to review. You decide what gets sent",
    ],
  },
  {
    name: "Weekly Briefing",
    schedule: "Mondays 8 AM",
    description:
      "Delivers a clear picture of your business every Monday. Cash, revenue, spending, and what needs your attention.",
    details: [
      "Summarizes cash position across all accounts",
      "Tracks revenue and spending trends week over week",
      "Lists action items like overdue invoices and large expenses",
    ],
  },
  {
    name: "Expense Detector",
    schedule: "Daily 10 AM",
    description:
      "Watches your expenses in the background. Learns what's normal and only alerts you when something looks off.",
    details: [
      "Builds spending baselines by category over 90 days",
      "Catches duplicate charges, spikes, and unknown vendors",
      "Stays completely silent on normal days",
    ],
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Describe",
    description:
      "Tell Midday what you need in plain English, or pick a ready-made agent from the catalog.",
  },
  {
    step: "02",
    title: "Review",
    description:
      "Midday builds the agent and shows you the plan. You confirm when it looks right.",
  },
  {
    step: "03",
    title: "Automate",
    description:
      "It runs on your schedule, learns from every run, and gets more useful over time.",
  },
  {
    step: "04",
    title: "Control",
    description:
      "See everything it does. Approve actions before they happen. You're always in the loop.",
  },
];

const PROMPTS = [
  "Chase my overdue invoices every Tuesday",
  "Alert me when expenses look unusual",
  "Give me a weekly briefing every Monday morning",
  "Flag contractor spend when it exceeds budget",
  "Post my weekly revenue summary to Slack",
];

function PromptShowcase() {
  const [index, setIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [cursorOn, setCursorOn] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setCursorOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const prompt = PROMPTS[index] as string;
    let i = 0;
    setDisplayed("");
    const typeId = setInterval(() => {
      if (i <= prompt.length) {
        setDisplayed(prompt.slice(0, i));
        i++;
      } else {
        clearInterval(typeId);
        setTimeout(() => {
          setIndex((prev) => (prev + 1) % PROMPTS.length);
        }, 2500);
      }
    }, 50);
    return () => clearInterval(typeId);
  }, [index]);

  const cursor = (
    <span
      className={cn(
        "inline-block w-[7px] h-[15px] ml-px align-middle bg-foreground",
        cursorOn ? "opacity-100" : "opacity-0",
      )}
    />
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="border border-border p-6 font-mono text-foreground text-base md:text-lg"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-60deg, hsla(var(--border), 0.4), hsla(var(--border), 0.4) 1px, transparent 1px, transparent 6px)",
        }}
      >
        <span className="text-muted-foreground">$ midday computer create </span>
        &quot;{displayed}
        {cursor}&quot;
      </div>
      <p className="text-center mt-4 text-sm text-muted-foreground">
        One sentence. That&apos;s all it takes.
      </p>
    </div>
  );
}

export function Computer() {
  return (
    <div className="font-mono relative mt-16">
      {/* Hero */}
      <div className="max-w-screen-xl mx-auto pt-16 pb-12 md:py-28 flex flex-col lg:flex-row gap-12 justify-between items-center">
        <div className="lg:max-w-[590px] space-y-8 w-full">
          <div>
            <span className="inline-block text-[10px] tracking-widest uppercase border border-border px-2 py-0.5 mb-6 text-muted-foreground">
              Private Beta
            </span>
            <h1 className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-tight font-sans">
              The operating system for your business.
            </h1>
            <p className="text-base leading-normal mt-4 md:mt-8 text-muted-foreground">
              Midday Computer puts your business on autopilot. Agents that run
              on your schedule, learn over time, and take care of the work you
              keep putting off.
            </p>
          </div>

          <div className="lg:max-w-[480px]">
            <CopyInstall />
          </div>

          <div className="flex items-center gap-4">
            <Button
              asChild
              className="h-11 px-6 text-sm font-mono hover:!bg-[hsl(0,0%,85%)]"
            >
              <Link href="https://app.midday.ai">Get started</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hidden md:inline-flex h-11 px-6 text-sm font-mono hover:!bg-[hsl(0,0%,15%)] hover:!text-foreground"
            >
              <Link href="https://github.com/midday-ai/midday/tree/main/packages/cli">
                View documentation
              </Link>
            </Button>
          </div>
        </div>

        <Terminal />
      </div>

      <div className="space-y-16 max-w-screen-lg mx-auto">
        {/* Features */}
        <div className="mt-12">
          <h3 className="font-sans text-2xl text-foreground">What you get</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {features.map((feature) => (
              <div
                className="border border-border p-1 -mt-[1px] -ml-[1px]"
                key={feature.title}
              >
                <div className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-sm">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        {/* Catalog agents */}
        <div>
          <h3 className="font-sans text-2xl text-foreground">
            Pre-built agents
          </h3>
          <p className="text-sm mt-2 text-muted-foreground">
            Enable in one click. Already tuned for real business workflows.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 mt-4">
            {catalogAgents.map((agent) => (
              <div
                className="border border-border p-1 -mt-[1px] -ml-[1px]"
                key={agent.name}
              >
                <div className="p-5">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-sans">{agent.name}</h3>
                      <span className="text-[10px] tracking-widest uppercase text-muted-foreground">
                        {agent.schedule}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {agent.description}
                    </p>
                    <ul className="space-y-1.5">
                      {agent.details.map((detail) => (
                        <li
                          key={detail}
                          className="text-sm text-muted-foreground"
                        >
                          ◇ {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        {/* How it works */}
        <div>
          <h3 className="font-sans text-2xl text-foreground">How it works</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4">
            {howItWorks.map((item) => (
              <div
                className="border border-border p-1 -mt-[1px] -ml-[1px]"
                key={item.step}
              >
                <div className="p-5">
                  <div className="space-y-3">
                    <span
                      className="text-3xl font-sans"
                      style={{ color: "hsl(0, 0%, 30%)" }}
                    >
                      {item.step}
                    </span>
                    <h3 className="text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        {/* Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mt-4">
          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">Dashboard</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="text-sm">
                  ◇ &quot;Enable the invoice chaser&quot;
                </li>
                <li className="text-sm">
                  ◇ &quot;Create an agent that monitors expenses&quot;
                </li>
                <li className="text-sm">◇ Manage agents from chat</li>
                <li className="text-sm">◇ View run history and results</li>
              </ul>
            </div>
          </div>

          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">Chat</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="text-sm">
                  ◇ iMessage, WhatsApp, Slack, Telegram
                </li>
                <li className="text-sm">
                  ◇ Get notified and approve on the go
                </li>
                <li className="text-sm">◇ Check agent results from any chat</li>
                <li className="text-sm">◇ No app to install</li>
              </ul>
            </div>
          </div>

          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">CLI</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="text-sm">◇ Create, run, and manage agents</li>
                <li className="text-sm">◇ Approve proposals from terminal</li>
                <li className="text-sm">◇ Inspect memory and run history</li>
                <li className="text-sm">◇ Sign in with your browser</li>
              </ul>
            </div>
          </div>

          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">API</h2>
              <ul className="space-y-2 text-muted-foreground">
                <li className="text-sm">◇ Build your own integrations</li>
                <li className="text-sm">◇ Trigger runs programmatically</li>
                <li className="text-sm">◇ Manage proposals and approvals</li>
                <li className="text-sm">◇ Full step trace access</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hidden md:flex justify-center mt-12">
          <Button
            asChild
            className="h-11 px-6 text-sm font-mono hover:!bg-[hsl(0,0%,85%)]"
          >
            <Link href="https://app.midday.ai">Get started</Link>
          </Button>
        </div>

        <div className="hidden md:block">
          <SectionDivider />
        </div>

        {/* Infrastructure diagram */}
        <div className="hidden md:block text-center">
          <h2 className="font-sans text-2xl sm:text-3xl text-foreground">
            How it works
          </h2>
          <p className="text-base leading-normal mt-4 max-w-md mx-auto text-muted-foreground">
            You describe what you need. Midday builds the agent, runs it on your
            schedule, and delivers results.
          </p>

          <div className="hidden md:flex flex-col items-center justify-center mt-2">
            <pre
              className="p-4 text-sm leading-5 md:scale-[0.8] transform-gpu"
              style={{
                fontFamily: "monospace",
                whiteSpace: "pre",
                textAlign: "left",
              }}
            >
              <InfraDiagram />
            </pre>
          </div>
        </div>

        <SectionDivider />

        {/* Prompt showcase */}
        <div className="text-center">
          <h2 className="font-sans text-2xl sm:text-3xl text-foreground mb-8">
            What would your agent do?
          </h2>
          <PromptShowcase />
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-screen-lg mx-auto mt-16 mb-24">
        <div className="bg-background border border-border p-8 lg:p-12 text-center relative before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-60deg,hsla(var(--border),0.4),hsla(var(--border),0.4)_1px,transparent_1px,transparent_6px)] before:pointer-events-none">
          <div className="relative z-10">
            <h2 className="font-sans text-2xl sm:text-3xl text-foreground mb-4">
              Get started
            </h2>
            <p className="font-sans text-base mb-6 max-w-lg mx-auto text-muted-foreground">
              Midday Computer puts your business on autopilot. Describe what you
              need and it takes care of the rest.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                className="h-11 px-6 text-sm font-mono hover:!bg-[hsl(0,0%,85%)]"
              >
                <Link href="https://app.midday.ai">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-6 text-sm font-mono border-primary bg-background hover:!bg-[hsl(0,0%,15%)] hover:!text-foreground"
              >
                <Link href="https://github.com/midday-ai/midday/tree/main/packages/cli">
                  View documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
