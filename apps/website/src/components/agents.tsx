"use client";

import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

const MIDDAY_ASCII = [
  "  ███╗   ███╗██╗██████╗ ██████╗  █████╗ ██╗   ██╗",
  "  ████╗ ████║██║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝",
  "  ██╔████╔██║██║██║  ██║██║  ██║███████║ ╚████╔╝ ",
  "  ██║╚██╔╝██║██║██║  ██║██║  ██║██╔══██║  ╚██╔╝  ",
  "  ██║ ╚═╝ ██║██║██████╔╝██████╔╝██║  ██║   ██║   ",
  "  ╚═╝     ╚═╝╚═╝╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ",
].join("\n");

const PIPELINE_DIAGRAM = `
                                  ┌───────────────┐
                                  │    Agents     │
                                  └───────────────┘
                                          │
                                          ▼
             ┌─────────────────────────────────────────────────────────┐
             │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
             │░░░░░░░░░░░░░░░░░░░░░ Midday Engine ░░░░░░░░░░░░░░░░░░░░░│
             │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│
             └─────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                                          │
            ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┼ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
           │                              │                              │
           ▼                              ▼                              ▼
 ╔═══════════════════╗          ╔═══════════════════╗          ╔═══════════════════╗
 ║                   ║          ║                   ║          ║                   ║
 ║     Invoices      ║          ║   Transactions    ║          ║   Time Tracking   ║
 ║                   ║          ║                   ║          ║                   ║
 ╚═══════════════════╝          ╚═══════════════════╝          ╚═══════════════════╝
           │                              │                              │
           └──────────────────────────────┼──────────────────────────────┘
                                          ▼
                              ┌─────────────────────┐
                              │      Completed      │
                              │      (Synced)       │
                              └─────────────────────┘
`;

const matrixWords = [
  "Invoices",
  "Transactions",
  "Dashboard",
  "Settings",
  "Customers",
  "Products",
  "Reports",
  "Analytics",
  "Exports",
  "Documents",
  "Inbox",
  "Teams",
  "Tracking",
  "Accounts",
  "Categories",
  "Tags",
  "OAuth",
  "CLI",
  "MCP",
  "API",
  "Notifications",
  "Search",
  "Help",
  "Payments",
];

function scrambleWord(word: string): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]|;:,.<>?";
  return word
    .split("")
    .map((char) =>
      Math.random() > 0.5
        ? chars[Math.floor(Math.random() * chars.length)]
        : char,
    )
    .join("");
}

function getRandomWord() {
  return matrixWords[Math.floor(Math.random() * matrixWords.length)];
}

type WordState = {
  word: string;
  scrambledWord: string;
  isScrambling: boolean;
};

const MatrixWord: React.FC<WordState> = React.memo(
  ({ word, scrambledWord, isScrambling }) => {
    return (
      <span className="p-1 transition-colors duration-300 ease-in-out text-[#242424]">
        {isScrambling ? scrambledWord : word}
      </span>
    );
  },
);

MatrixWord.displayName = "MatrixWord";

function MatrixTextWall() {
  const [matrix, setMatrix] = useState<WordState[][]>([]);

  useEffect(() => {
    setMatrix(
      Array.from({ length: 20 }, () =>
        Array.from({ length: 20 }, () => {
          const word = getRandomWord();
          return {
            word,
            scrambledWord: scrambleWord(word),
            isScrambling: false,
          };
        }),
      ),
    );
  }, []);

  const updateMatrix = useCallback(() => {
    setMatrix((prevMatrix) =>
      prevMatrix.map((row) =>
        row.map((cell) => {
          if (Math.random() < 0.01) {
            const newWord = getRandomWord();
            return {
              word: newWord,
              scrambledWord: scrambleWord(newWord),
              isScrambling: true,
            };
          }
          if (cell.isScrambling) {
            return {
              ...cell,
              scrambledWord: scrambleWord(cell.word),
              isScrambling: Math.random() > 0.2,
            };
          }
          return cell;
        }),
      ),
    );
  }, []);

  useEffect(() => {
    const interval = setInterval(updateMatrix, 100);
    return () => clearInterval(interval);
  }, [updateMatrix]);

  return (
    <div className="absolute inset-0 overflow-hidden select-none -z-[1] opacity-40">
      <div className="text-[0.4rem] sm:text-[0.5rem] md:text-xs lg:text-sm absolute inset-0 flex flex-col justify-between">
        {matrix.map((row, i) => (
          <div key={i.toString()} className="flex whitespace-nowrap">
            {row.map((cell, j) => (
              <MatrixWord key={j.toString()} {...cell} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function GrainOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const size = 256;
    canvas.width = size;
    canvas.height = size;
    const imageData = ctx.createImageData(size, size);
    for (let i = 0; i < imageData.data.length; i += 4) {
      const v = Math.random() * 255;
      imageData.data[i] = v;
      imageData.data[i + 1] = v;
      imageData.data[i + 2] = v;
      imageData.data[i + 3] = 15;
    }
    ctx.putImageData(imageData, 0, 0);
    setUrl(canvas.toDataURL("image/png"));
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {url && (
        <div
          className="pointer-events-none fixed inset-0 z-[60]"
          aria-hidden="true"
          style={{
            backgroundImage: `url(${url})`,
            backgroundRepeat: "repeat",
          }}
        />
      )}
    </>
  );
}

function DottedSeparator() {
  return (
    <div
      className="h-[45px] w-full"
      style={{
        backgroundImage:
          "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)",
        backgroundSize: "2.5px 2.5px",
      }}
    />
  );
}

function OutlinedButton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
}) {
  return (
    <div className="relative inline-block">
      <div
        className={cn(
          "absolute left-[5px] top-[5px] h-full w-full border",
          variant === "secondary" ? "border-border" : "border-primary",
        )}
      />
      <div
        className={cn(
          "relative font-mono text-sm px-4 py-2 transition-all hover:translate-x-0.5 hover:translate-y-0.5 border",
          variant === "secondary"
            ? "bg-background text-foreground border-border"
            : "bg-primary text-primary-foreground border-primary",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function CopyInstall() {
  const [copied, setCopied] = useState(false);

  const copyCommand = () => {
    navigator.clipboard.writeText("npx @midday/cli");
    setCopied(true);
    setTimeout(() => setCopied(false), 1000);
  };

  return (
    <div className="flex border border-dashed border-muted-foreground p-2 px-4 text-sm w-full relative">
      <button
        type="button"
        onClick={copyCommand}
        className="flex items-center space-x-2 overflow-hidden"
      >
        <span className="text-foreground truncate">$ npx @midday/cli</span>
      </button>

      <div className="flex items-center space-x-2 ml-auto">
        <button type="button" onClick={copyCommand}>
          {copied ? (
            <Icons.Check size={14} className="text-foreground" />
          ) : (
            <Icons.Copy size={14} className="text-muted-foreground" />
          )}
        </button>
      </div>

      {copied && (
        <div className="absolute left-1/2 -translate-x-1/2 -top-7 text-xs text-foreground animate-in fade-in slide-in-from-bottom-1">
          Copied
        </div>
      )}
    </div>
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
    label: "Invoices",
    cmd1: "midday invoices list --status unpaid",
    cmd2: "midday invoices send inv_0042",
    spin1: "Fetching invoices...",
    spin2: "Sending invoice...",
    done2: "Sending invoice...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-primary text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-muted-foreground">
          Invoices [3]
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-primary">
              <th className="font-normal pl-3 pr-2 pb-1 text-muted-foreground">
                INV#
              </th>
              <th className="font-normal pr-2 pb-1 text-muted-foreground">
                CUSTOMER
              </th>
              <th className="font-normal pr-2 pb-1 text-right text-muted-foreground">
                AMOUNT
              </th>
              <th className="font-normal pr-2 pb-1 text-muted-foreground">
                STATUS
              </th>
              <th className="font-normal pr-3 pb-1 text-muted-foreground">
                DUE
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">INV-0042</td>
              <td className="pr-2 py-[3px]">Acme Corp</td>
              <td className="pr-2 py-[3px] text-right">$4,800.00</td>
              <td className="pr-2 py-[3px]">UNPAID</td>
              <td className="pr-3 py-[3px]">Apr 27</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">INV-0039</td>
              <td className="pr-2 py-[3px]">Vercel Inc</td>
              <td className="pr-2 py-[3px] text-right">$12,500.00</td>
              <td className="pr-2 py-[3px]">UNPAID</td>
              <td className="pr-3 py-[3px]">Apr 15</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">INV-0036</td>
              <td className="pr-2 py-[3px]">Linear</td>
              <td className="pr-2 py-[3px] text-right">$2,200.00</td>
              <td className="pr-2 py-[3px]">UNPAID</td>
              <td className="pr-3 py-[3px]">Apr 10</td>
            </tr>
          </tbody>
        </table>
        <div className="px-3 pb-2 text-[11px] text-muted-foreground">
          Page 1 of 1
        </div>
      </div>
    ),
    result2Line: "  Sent invoice INV-0042",
  },
  {
    label: "Transactions",
    cmd1: "midday transactions list --status pending",
    cmd2: "midday transactions update txn_8801 --category software",
    spin1: "Fetching transactions...",
    spin2: "Updating transaction...",
    done2: "Updating transaction...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-primary text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-muted-foreground">
          Transactions [4]
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-primary">
              <th className="font-normal pl-3 pr-2 pb-1 text-muted-foreground">
                DATE
              </th>
              <th className="font-normal pr-2 pb-1 text-muted-foreground">
                DESCRIPTION
              </th>
              <th className="font-normal pr-2 pb-1 text-right text-muted-foreground">
                AMOUNT
              </th>
              <th className="font-normal pr-2 pb-1 text-muted-foreground">
                CATEGORY
              </th>
              <th className="font-normal pr-3 pb-1 text-muted-foreground">
                STATUS
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Mar 25</td>
              <td className="pr-2 py-[3px]">GitHub Inc</td>
              <td className="pr-2 py-[3px] text-right">-$44.00</td>
              <td className="pr-2 py-[3px]">—</td>
              <td className="pr-3 py-[3px]">PENDING</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Mar 24</td>
              <td className="pr-2 py-[3px]">Vercel Inc</td>
              <td className="pr-2 py-[3px] text-right">-$20.00</td>
              <td className="pr-2 py-[3px]">—</td>
              <td className="pr-3 py-[3px]">PENDING</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Mar 23</td>
              <td className="pr-2 py-[3px]">Figma</td>
              <td className="pr-2 py-[3px] text-right">-$15.00</td>
              <td className="pr-2 py-[3px]">—</td>
              <td className="pr-3 py-[3px]">PENDING</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Mar 22</td>
              <td className="pr-2 py-[3px]">Linear</td>
              <td className="pr-2 py-[3px] text-right">-$8.00</td>
              <td className="pr-2 py-[3px]">—</td>
              <td className="pr-3 py-[3px]">PENDING</td>
            </tr>
          </tbody>
        </table>
        <div className="px-3 pb-2 text-[11px] text-muted-foreground">
          Page 1 of 1
        </div>
      </div>
    ),
    result2Line: "  Updated txn_8801 — category: software",
  },
  {
    label: "Tracker",
    cmd1: 'midday tracker start --project "Website Redesign"',
    cmd2: "midday tracker stop",
    spin1: "Starting timer...",
    spin2: "Stopping timer...",
    done2: "Stopping timer...",
    result1: (
      <div className="mt-2 text-muted-foreground text-[12px] space-y-0.5">
        <div> Timer started</div>
        <div> Project: Website Redesign</div>
        <div> Started: Mar 27, 2026 09:15 AM</div>
      </div>
    ),
    result2Line: "  Stopped — 2h 34m tracked to Website Redesign",
  },
  {
    label: "Reports",
    cmd1: "midday reports profit --from 2026-01",
    cmd2: "midday reports burn-rate",
    spin1: "Generating report...",
    spin2: "Calculating burn rate...",
    done2: "Calculating burn rate...",
    result1: (
      <div className="relative mt-3 border-[0.5px] border-primary text-foreground text-[12px]">
        <span className="absolute -top-[10px] left-3 bg-background px-1.5 text-[11px] tracking-wide text-muted-foreground">
          Profit Report
        </span>
        <table className="w-full mt-2 mb-1">
          <thead>
            <tr className="text-left border-b-[0.5px] border-primary">
              <th className="font-normal pl-3 pr-2 pb-1 text-muted-foreground">
                METRIC
              </th>
              <th className="font-normal pr-3 pb-1 text-right text-muted-foreground">
                AMOUNT
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Revenue</td>
              <td className="pr-3 py-[3px] text-right">$84,200.00</td>
            </tr>
            <tr>
              <td className="pl-3 pr-2 py-[3px]">Expenses</td>
              <td className="pr-3 py-[3px] text-right">-$31,450.00</td>
            </tr>
            <tr className="border-t-[0.5px] border-primary">
              <td className="pl-3 pr-2 py-[3px]">Profit</td>
              <td className="pr-3 py-[3px] text-right">$52,750.00</td>
            </tr>
          </tbody>
        </table>
        <div className="px-3 pb-2 text-[11px] text-muted-foreground">
          Jan 2026 — Mar 2026
        </div>
      </div>
    ),
    result2Line: "  Burn rate: $10,483/mo — runway: 18 months",
  },
];

function Terminal() {
  const [activeTab, setActiveTab] = useState(0);
  const [phase, setPhase] = useState<Phase>("typing-1");
  const [typed1, setTyped1] = useState("");
  const [typed2, setTyped2] = useState("");
  const [frame, setFrame] = useState(0);
  const [cursorOn, setCursorOn] = useState(true);
  const [autoCycle, setAutoCycle] = useState(true);
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
    setAutoCycle(false);
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
    if (phase !== "done" || !autoCycle) return;
    const t = setTimeout(() => {
      setActiveTab((prev) => (prev + 1) % SCENARIOS.length);
    }, 2000);
    return () => clearTimeout(t);
  }, [phase, autoCycle]);

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

  const prompt = <span className="text-muted-foreground/60">~ $ </span>;

  const spin = (text: string) => (
    <div className="text-muted-foreground">
      {ORA_FRAMES[frame]} {text}
    </div>
  );

  const done = (text: string) => (
    <div className="text-muted-foreground">{text}</div>
  );

  return (
    <div className="max-w-3xl w-full font-mono">
      <div className="overflow-hidden border border-border">
        <div className="select-none flex items-center h-7 px-3 border-b border-border bg-background/80">
          <div className="flex gap-[5px]">
            <span className="block w-2 h-2 rounded-full bg-foreground/20" />
            <span className="block w-2 h-2 rounded-full bg-foreground/20" />
            <span className="block w-2 h-2 rounded-full bg-foreground/20" />
          </div>
          <span className="flex-1 text-center text-[10px] tracking-wide text-muted-foreground/40 -ml-10">
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
                  : "text-muted-foreground/60 hover:text-muted-foreground border-b-border",
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
          <div>{prompt}npx @midday/cli</div>

          <pre
            className="text-[8px] sm:text-[10px] leading-none text-foreground/20 mt-3 whitespace-pre overflow-x-auto"
            style={{
              fontFamily:
                "SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace",
            }}
          >
            {MIDDAY_ASCII}
          </pre>
          <div className="text-muted-foreground/40 text-[10px] tracking-widest mt-1.5 mb-5">
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
      "Revenue, burn rate, runway — your agent has the numbers. Ask for a report and get structured data back.",
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

export function Agents({ pixelFontClass }: { pixelFontClass?: string }) {
  return (
    <div className="font-mono relative">
      <GrainOverlay />
      <div className="max-w-screen-xl mx-auto px-4 py-12 md:py-28 flex flex-col lg:flex-row gap-12 justify-between items-center">
        <div className="lg:max-w-[590px] space-y-8 w-full">
          <h1
            className={cn(
              "text-6xl md:text-8xl !leading-[1.05] text-pretty",
              pixelFontClass,
            )}
          >
            Let agents run your business.
          </h1>
          <p className="text-muted-foreground text-sm">
            One CLI. 80+ tools. Your agent can send invoices, reconcile
            transactions, track time, pull reports — anything you do in Midday,
            it can do too.
          </p>

          <div className="lg:max-w-[480px]">
            <CopyInstall />
          </div>

          <div className="flex items-center gap-8">
            <Link href="https://app.midday.ai">
              <OutlinedButton>Start automating</OutlinedButton>
            </Link>
            <Link href="/docs" className="hidden md:block">
              <OutlinedButton variant="secondary">
                Read documentation
              </OutlinedButton>
            </Link>
          </div>
        </div>

        <Terminal />
      </div>

      <div className="space-y-16 max-w-screen-lg mx-auto px-4">
        <div className="mt-12">
          <h3>Features</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-4">
            {features.map((feature) => (
              <div
                className="border border-border p-1 -mt-[1px]"
                key={feature.title}
              >
                <div className="p-4">
                  <div className="space-y-4">
                    <h3 className="text-sm">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DottedSeparator />

        <div className="flex flex-col space-y-12 pb-12">
          <div>
            <h2 className="text-sm mb-4">CLI</h2>
            <ul className="text-muted-foreground mt-4">
              <li className="text-sm">
                <span className="text-lg">◇</span> Invoices, transactions,
                customers, and time tracking
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Structured output for agents
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> OAuth login via browser
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Workspace switching
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Human-readable tables
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm mb-4">MCP</h2>
            <ul className="text-muted-foreground mt-4">
              <li className="text-sm">
                <span className="text-lg">◇</span> 80+ tools for business
                operations
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Works with Cursor, Claude,
                Raycast, and more
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Granular read/write
                permissions
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Real-time data from your
                workspace
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Same API surface as the CLI
              </li>
            </ul>
          </div>

          <div>
            <h2 className="text-sm mb-4">Developer experience</h2>
            <ul className="text-muted-foreground mt-4">
              <li className="text-sm">
                <span className="text-lg">◇</span> Single npx command to start
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> No configuration files
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> TypeScript and Go SDKs
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> REST API access
              </li>
              <li className="text-sm">
                <span className="text-lg">◇</span> Open-source
              </li>
            </ul>
          </div>
        </div>

        <Link href="https://app.midday.ai">
          <OutlinedButton>Start automating</OutlinedButton>
        </Link>

        <DottedSeparator />

        <div>
          <h2 className="text-sm mb-4">Pipeline</h2>
          <p className="text-muted-foreground text-sm">
            From CLI command or MCP tool call to synced dashboard — every
            operation flows through the same engine.
          </p>

          <div className="flex flex-col items-center justify-center p-4 mt-10 h-[400px] sm:h-[500px] md:h-[650px]">
            <pre
              className="p-4 text-sm leading-5 scale-[0.5] sm:scale-[0.65] md:scale-90 transform-gpu"
              style={{
                fontFamily: "monospace",
                whiteSpace: "pre",
                textAlign: "left",
              }}
            >
              {PIPELINE_DIAGRAM}
            </pre>
          </div>
        </div>
      </div>

      <div className="max-w-screen-lg mx-auto px-4 mt-16 mb-24">
        <div className="relative">
          <div className="absolute left-1/2 -translate-x-1/2 bg-background -top-[10px] px-4 sm:px-8 uppercase text-center z-10 text-sm">
            Get started
          </div>

          <div className="border border-border p-1 bg-background overflow-hidden">
            <div className="border border-border px-4 sm:px-32 py-12 sm:py-24 flex flex-col sm:flex-row gap-4 bg-background overflow-hidden relative">
              <div className="space-y-4 z-10">
                <h4 className="font-serif text-[16px]">
                  Let agents run your business.
                </h4>
                <p className="text-muted-foreground text-sm block pb-4">
                  One CLI. One MCP server. Every business operation your agent
                  needs — invoices, transactions, time tracking, and more.
                </p>

                <div className="flex items-center gap-8 text-center sm:text-left">
                  <Link href="https://app.midday.ai">
                    <OutlinedButton>Start automating</OutlinedButton>
                  </Link>
                  <Link href="/docs" className="hidden md:block">
                    <OutlinedButton variant="secondary">
                      Read documentation
                    </OutlinedButton>
                  </Link>
                </div>
              </div>

              <MatrixTextWall />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
