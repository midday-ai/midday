"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

const DOT_COLOR = "hsl(225, 60%, 55%)";

function InfraDiagram() {
  const d = (text: string) => <span style={{ color: DOT_COLOR }}>{text}</span>;
  return (
    <>
      {
        "                                                  ┌──────────────────┐\n"
      }
      {
        "                                                  │      Agents      │\n"
      }
      {
        "                                                  └────────┬─────────┘\n"
      }
      {"                                                           │\n"}
      {"                                                    MCP / CLI / API\n"}
      {"                                                           │\n"}
      {
        " ┌─────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────┐\n"
      }
      {" │"}
      {d(
        "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
      )}
      {"│\n"}
      {" │"}
      {d("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░")}
      {"  Midday  "}
      {d("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░")}
      {"│\n"}
      {" │"}
      {d(
        "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
      )}
      {"│\n"}
      {" │"}
      {d("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░")}
      {"  The backbone for your business  "}
      {d("░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░")}
      {"│\n"}
      {" │"}
      {d(
        "░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░",
      )}
      {"│\n"}
      {
        " └──────┬────────────────┬───────────────┬───────────────┬──────────────┬──────────────┬─────────────┬───────────────┘\n"
      }
      {
        "        │                │               │               │              │              │             │\n"
      }
      {
        "        ▼                ▼               ▼               ▼              ▼              ▼             ▼\n"
      }
      {"\n"}
      {
        "   ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐\n"
      }
      {
        "   │ Invoices │  │ Transactions │  │ Tracker  │  │  Customers   │  │ Reports  │  │ Banking  │  │ Exports  │\n"
      }
      {
        "   └──────────┘  └──────────────┘  └──────────┘  └──────────────┘  └──────────┘  └──────────┘  └──────────┘"
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
    navigator.clipboard.writeText("npx @midday-ai/cli@latest");
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <button
      type="button"
      onClick={copyCommand}
      className="flex border border-border p-2 px-4 text-sm w-full relative cursor-pointer hover:bg-[hsl(225,70%,28%)] transition-colors"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-60deg, hsla(var(--border), 0.4), hsla(var(--border), 0.4) 1px, transparent 1px, transparent 6px)",
      }}
    >
      <span className="text-foreground truncate">
        $ npx @midday-ai/cli@latest
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
  result2Line: string;
};

const SCENARIOS: Scenario[] = [
  {
    label: "Bill from time",
    cmd1: 'midday invoices create --from-tracker "Website Redesign" --period 2026-03',
    cmd2: "midday invoices send inv_0048",
    spin1: "Creating invoice from time entries...",
    spin2: "Sending invoice...",
    done2: "Sending invoice...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-primary text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-foreground">
          INV-0048 created from tracker
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-primary">
              <th className="font-normal pl-3 pr-2 pb-1 text-foreground">
                ENTRY
              </th>
              <th className="font-normal pr-2 pb-1 text-right text-foreground">
                HOURS
              </th>
              <th className="font-normal pr-2 pb-1 text-right text-foreground">
                RATE
              </th>
              <th className="font-normal pr-3 pb-1 text-right text-foreground">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Design system</td>
              <td className="pr-2 py-[3px] text-right">24h</td>
              <td className="pr-2 py-[3px] text-right">$150</td>
              <td className="pr-3 py-[3px] text-right">$3,600.00</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Frontend build</td>
              <td className="pr-2 py-[3px] text-right">38h</td>
              <td className="pr-2 py-[3px] text-right">$150</td>
              <td className="pr-3 py-[3px] text-right">$5,700.00</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Code review</td>
              <td className="pr-2 py-[3px] text-right">8h</td>
              <td className="pr-2 py-[3px] text-right">$150</td>
              <td className="pr-3 py-[3px] text-right">$1,200.00</td>
            </tr>
            <tr className="border-t-[0.5px] border-primary">
              <td className="pl-3 pr-2 py-[3px]">Total</td>
              <td className="pr-2 py-[3px] text-right">70h</td>
              <td className="pr-2 py-[3px]" />
              <td className="pr-3 py-[3px] text-right">$10,500.00</td>
            </tr>
          </tbody>
        </table>
        <div className="px-3 pb-2 text-[11px] text-foreground">
          Customer: Acme Corp
        </div>
      </div>
    ),
    result2Line: "  Sent INV-0048 to billing@acme.corp",
  },
  {
    label: "Reconcile",
    cmd1: "midday inbox list --unmatched",
    cmd2: "midday inbox match --all --auto",
    spin1: "Fetching unmatched items...",
    spin2: "Matching 3 receipts to transactions...",
    done2: "Matching 3 receipts to transactions...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-primary text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-foreground">
          Unmatched [3]
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-primary">
              <th className="font-normal pl-3 pr-2 pb-1 text-foreground">ID</th>
              <th className="font-normal pr-2 pb-1 text-foreground">FILE</th>
              <th className="font-normal pr-2 pb-1 text-right text-foreground">
                AMOUNT
              </th>
              <th className="font-normal pr-3 pb-1 text-foreground">
                SUGGESTED
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">inb_0091</td>
              <td className="pr-2 py-[3px]">aws-march.pdf</td>
              <td className="pr-2 py-[3px] text-right">$2,340.00</td>
              <td className="pr-3 py-[3px]">txn_7720</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">inb_0089</td>
              <td className="pr-2 py-[3px]">figma-receipt.pdf</td>
              <td className="pr-2 py-[3px] text-right">$45.00</td>
              <td className="pr-3 py-[3px]">txn_7718</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">inb_0087</td>
              <td className="pr-2 py-[3px]">vercel-inv.pdf</td>
              <td className="pr-2 py-[3px] text-right">$20.00</td>
              <td className="pr-3 py-[3px]">txn_7715</td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
    result2Line: "  Matched 3/3 receipts. All transactions reconciled.",
  },
  {
    label: "Export",
    cmd1: "midday transactions export --to quickbooks --period 2026-Q1",
    cmd2: "midday export status job_4401",
    spin1: "Exporting 142 transactions to QuickBooks...",
    spin2: "Checking export status...",
    done2: "Checking export status...",
    result1: (
      <div className="mt-2 text-foreground text-[12px] space-y-0.5">
        <div> Export started</div>
        <div> Provider: QuickBooks</div>
        <div> Period: Jan 1 - Mar 31, 2026</div>
        <div> Transactions: 142</div>
        <div> Job ID: job_4401</div>
      </div>
    ),
    result2Line: "  Export complete. 142 transactions synced to QuickBooks.",
  },
  {
    label: "Forecast",
    cmd1: "midday reports revenue-forecast",
    cmd2: "midday reports cash-flow --period 2026-Q2",
    spin1: "Generating revenue forecast...",
    spin2: "Calculating cash flow...",
    done2: "Calculating cash flow...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-primary text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-foreground">
          Revenue Forecast
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-primary">
              <th className="font-normal pl-3 pr-2 pb-1 text-foreground">
                MONTH
              </th>
              <th className="font-normal pr-2 pb-1 text-right text-foreground">
                PROJECTED
              </th>
              <th className="font-normal pr-3 pb-1 text-right text-foreground">
                RECURRING
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Apr 2026</td>
              <td className="pr-2 py-[3px] text-right">$28,400.00</td>
              <td className="pr-3 py-[3px] text-right">$19,500.00</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">May 2026</td>
              <td className="pr-2 py-[3px] text-right">$31,200.00</td>
              <td className="pr-3 py-[3px] text-right">$19,500.00</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Jun 2026</td>
              <td className="pr-2 py-[3px] text-right">$29,800.00</td>
              <td className="pr-3 py-[3px] text-right">$19,500.00</td>
            </tr>
          </tbody>
        </table>
        <div className="px-3 pb-2 text-[11px] text-foreground">
          Growth rate: +8.2% MoM
        </div>
      </div>
    ),
    result2Line: "  Q2 net cash flow: +$47,200.00",
  },
];

function Terminal({ pixelFontClass }: { pixelFontClass?: string }) {
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
    }, 2000);
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

  const done = (text: string) => <div className="text-foreground">{text}</div>;

  return (
    <div className="max-w-3xl w-full font-mono">
      <div className="overflow-hidden border border-border">
        <div className="select-none flex items-center h-7 px-3 border-b border-border bg-[hsl(225,70%,26%)]">
          <div className="flex gap-[5px]">
            <span className="block w-2 h-2 rounded-full bg-[hsl(225,50%,40%)]" />
            <span className="block w-2 h-2 rounded-full bg-[hsl(225,50%,40%)]" />
            <span className="block w-2 h-2 rounded-full bg-[hsl(225,50%,40%)]" />
          </div>
          <span className="flex-1 text-center text-[10px] tracking-wide text-foreground -ml-10">
            midday — zsh
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
                  : "text-[hsl(225,60%,75%)] hover:text-foreground border-b-border",
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
          <div>{prompt}npx @midday-ai/cli@latest</div>

          <div
            className={cn(
              "text-7xl sm:text-8xl text-foreground mt-3",
              pixelFontClass,
            )}
          >
            midday
          </div>
          <div className="text-[hsl(225,60%,75%)] text-[10px] tracking-widest mt-1.5 mb-5">
            v0.1.0 · agent@acme.corp · Midday Labs AB
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
            <>
              <div className="mt-1">{done(scenario.done2)}</div>
              <div className="mt-1">{scenario.result2Line}</div>
            </>
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
    title: "Automate invoices",
    description:
      "Agents create, send, and follow up on invoices without manual steps. From draft to paid, hands-free.",
  },
  {
    title: "Reconcile transactions",
    description:
      "Let agents categorize and match transactions as they come in. No more end-of-month cleanup.",
  },
  {
    title: "Track time automatically",
    description:
      "Agents start and stop timers based on your workflow. Time entries flow straight to projects and reports.",
  },
  {
    title: "Pull reports on demand",
    description:
      "Revenue, burn rate, runway. Your agent has the numbers. Ask for a report and get structured data back.",
  },
  {
    title: "Chase overdue payments",
    description:
      "Agents check for overdue invoices and send reminders on a schedule. Escalate automatically at 7, 30, and 60 days.",
  },
  {
    title: "Categorize spending",
    description:
      "New transactions get categorized instantly based on vendor history. No manual tagging, no rules to maintain.",
  },
  {
    title: "Match receipts",
    description:
      "Receipts land in your inbox and get matched to the right transaction automatically. Zero manual reconciliation.",
  },
  {
    title: "Close the books",
    description:
      "End-of-month on autopilot. Categorize remaining transactions, match receipts, flag discrepancies, generate reports.",
  },
  {
    title: "Monitor cash flow",
    description:
      "Get alerted when your balance drops below a threshold or when runway shrinks. No surprises.",
  },
  {
    title: "Sync to your stack",
    description:
      "Export transactions to QuickBooks, Xero, or your ERP on a schedule. Always in sync, never behind.",
  },
  {
    title: "Works with any MCP client",
    description:
      "Cursor, Claude, Windsurf, Raycast, or your own agent. Same 80+ tools, same API surface, any client.",
  },
  {
    title: "Zero setup",
    description:
      "One npx command. OAuth via browser. No API keys, no config files. Your agent is operational in seconds.",
  },
];

const possibilities = [
  {
    agent: "Claude",
    title: "Ask about your runway",
    description:
      "Ask Claude how much runway you have and get a structured financial breakdown with trends. No spreadsheets, no dashboards.",
  },
  {
    agent: "Cursor",
    title: "Bill clients while you code",
    description:
      "Cursor tracks your time per project as you work. At the end of the week, it drafts and sends invoices automatically.",
  },
  {
    agent: "OpenClaw",
    title: "A 24/7 finance assistant",
    description:
      "OpenClaw monitors overdue invoices overnight, sends reminders, categorizes transactions, and briefs you every morning.",
  },
  {
    agent: "Zapier",
    title: "Weekly P&L on autopilot",
    description:
      "Every Monday, Zapier pulls your profit and loss report and drops it in Slack. No one has to ask.",
  },
  {
    agent: "Your agent",
    title: "Build a custom workflow",
    description:
      "Use the REST API or TypeScript SDK to build exactly the agent you need. Pull transactions, create invoices, push to your ERP. Your logic, your rules.",
  },
  {
    agent: "Any MCP client",
    title: "One protocol, every tool",
    description:
      "Any app that speaks MCP gets instant access to 80+ Midday tools. No custom integration code, no API wrangling.",
  },
  {
    agent: "Raycast",
    title: "Invoice in a keystroke",
    description:
      "Hit a shortcut, type a customer name and amount. The invoice is created and sent before you finish your coffee.",
  },
  {
    agent: "Manus",
    title: "Reconcile while you sleep",
    description:
      "Manus matches transactions to invoices, flags anomalies, and categorizes everything. Ready for review when you wake up.",
  },
  {
    agent: "Custom scripts",
    title: "Automate with a cron job",
    description:
      "A 20-line script that runs nightly: fetch uncategorized transactions, classify them with your own rules, push updates back. No UI needed.",
  },
];

const THEME_COLOR = "hsl(225, 70%, 22%)";

export function Agents({ pixelFontClass }: { pixelFontClass?: string }) {
  useEffect(() => {
    const existing = document.querySelector('meta[name="theme-color"]');
    const prev = existing?.getAttribute("content") || "";
    if (existing) {
      existing.setAttribute("content", THEME_COLOR);
    } else {
      const meta = document.createElement("meta");
      meta.name = "theme-color";
      meta.content = THEME_COLOR;
      document.head.appendChild(meta);
    }
    return () => {
      const tag = document.querySelector('meta[name="theme-color"]');
      if (tag) {
        if (prev) {
          tag.setAttribute("content", prev);
        } else {
          tag.remove();
        }
      }
    };
  }, []);

  return (
    <div className="font-mono relative mt-16">
      <div className="max-w-screen-xl mx-auto pt-16 pb-12 md:py-28 flex flex-col lg:flex-row gap-12 justify-between items-center">
        <div className="lg:max-w-[590px] space-y-8 w-full">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl leading-[1.1] tracking-tight font-sans">
              Let agents run your business.
            </h1>
            <p className="text-[hsl(225,60%,75%)] text-base leading-normal mt-4 md:mt-8">
              One CLI. 80+ tools. Your agent can send invoices, reconcile
              transactions, track time, pull reports. Anything you do in Midday,
              it can do too.
            </p>
          </div>

          <div className="lg:max-w-[480px]">
            <CopyInstall />
          </div>

          <div className="flex items-center gap-4">
            <Button
              asChild
              className="h-11 px-6 text-sm font-mono hover:!bg-[hsl(225,50%,92%)]"
            >
              <Link href="https://app.midday.ai">Start automating</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="hidden md:inline-flex h-11 px-6 text-sm font-mono hover:!bg-[hsl(225,70%,28%)] hover:!text-foreground"
            >
              <Link href="https://github.com/midday-ai/midday/tree/main/packages/cli">
                Read documentation
              </Link>
            </Button>
          </div>
        </div>

        <Terminal pixelFontClass={pixelFontClass} />
      </div>

      <div className="space-y-16 max-w-screen-lg mx-auto">
        <div className="mt-12">
          <h3 className="font-sans text-2xl text-foreground">Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {features.map((feature) => (
              <div
                className="border border-border p-1 -mt-[1px] -ml-[1px]"
                key={feature.title}
              >
                <div className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-sm">{feature.title}</h3>
                    <p className="text-[hsl(225,60%,75%)] text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        <div>
          <h3 className="font-sans text-2xl text-foreground">Possibilities</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {possibilities.map((item) => (
              <div
                className="border border-border p-1 -mt-[1px] -ml-[1px]"
                key={item.title}
              >
                <div className="p-4">
                  <div className="space-y-3">
                    <span className="text-xs text-[hsl(225,50%,60%)] uppercase tracking-widest">
                      {item.agent}
                    </span>
                    <h3 className="text-sm">{item.title}</h3>
                    <p className="text-[hsl(225,60%,75%)] text-sm">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <SectionDivider />

        <div className="grid grid-cols-1 md:grid-cols-3 mt-4">
          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">CLI</h2>
              <ul className="text-[hsl(225,60%,75%)] space-y-2">
                <li className="text-sm">
                  ◇ Invoices, transactions, customers, and time tracking
                </li>
                <li className="text-sm">◇ Structured output for agents</li>
                <li className="text-sm">◇ OAuth login via browser</li>
                <li className="text-sm">◇ Workspace switching</li>
                <li className="text-sm">◇ Human-readable tables</li>
              </ul>
            </div>
          </div>

          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">MCP</h2>
              <ul className="text-[hsl(225,60%,75%)] space-y-2">
                <li className="text-sm">◇ 80+ tools for business operations</li>
                <li className="text-sm">
                  ◇ Works with Cursor, Claude, Raycast, and more
                </li>
                <li className="text-sm">◇ Granular read/write permissions</li>
                <li className="text-sm">
                  ◇ Real-time data from your workspace
                </li>
                <li className="text-sm">◇ Same API surface as the CLI</li>
              </ul>
            </div>
          </div>

          <div className="border border-border p-1 -mt-[1px] -ml-[1px]">
            <div className="p-4 space-y-4">
              <h2 className="text-sm">Developer experience</h2>
              <ul className="text-[hsl(225,60%,75%)] space-y-2">
                <li className="text-sm">◇ Single npx command to start</li>
                <li className="text-sm">◇ No configuration files</li>
                <li className="text-sm">◇ TypeScript and Go SDKs</li>
                <li className="text-sm">◇ REST API access</li>
                <li className="text-sm">◇ Open-source</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="hidden md:flex justify-center mt-12">
          <Button
            asChild
            className="h-11 px-6 text-sm font-mono hover:!bg-[hsl(225,50%,92%)]"
          >
            <Link href="https://app.midday.ai">Start automating</Link>
          </Button>
        </div>

        <div className="hidden md:block">
          <SectionDivider />
        </div>

        <div className="hidden md:block text-center">
          <h2 className="font-sans text-2xl sm:text-3xl text-foreground">
            Infrastructure
          </h2>
          <p className="text-[hsl(225,60%,75%)] text-base leading-normal mt-4 max-w-md mx-auto">
            Midday is the backbone. Agents connect via MCP, CLI, or API. Every
            operation syncs back to your dashboard.
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
      </div>

      <div className="max-w-screen-lg mx-auto mt-16 mb-24">
        <div className="bg-background border border-border p-8 lg:p-12 text-center relative before:absolute before:inset-0 before:bg-[repeating-linear-gradient(-60deg,hsla(var(--border),0.4),hsla(var(--border),0.4)_1px,transparent_1px,transparent_6px)] before:pointer-events-none">
          <div className="relative z-10">
            <h2 className="font-sans text-2xl sm:text-3xl text-foreground mb-4">
              Get started
            </h2>
            <p className="font-sans text-base text-[hsl(225,60%,75%)] mb-6 max-w-lg mx-auto">
              One CLI. One MCP server. Every business operation your agent
              needs.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button
                asChild
                className="h-11 px-6 text-sm font-mono hover:!bg-[hsl(225,50%,92%)]"
              >
                <Link href="https://app.midday.ai">Start automating</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 px-6 text-sm font-mono border-primary bg-background hover:!bg-[hsl(225,70%,45%)] hover:!text-foreground"
              >
                <Link href="https://github.com/midday-ai/midday/tree/main/packages/cli">
                  Read documentation
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
