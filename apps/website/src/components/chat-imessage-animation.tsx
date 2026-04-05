"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import type { CSSProperties, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

type ReceiptAttachment = {
  kind: "receipt";
  title: string;
  subtitle: string;
  amount: string;
  imageSrc?: string;
};

type MatchResultAttachment = {
  kind: "match-result";
  title: string;
  status: string;
  merchant: string;
  total: string;
  date: string;
  transaction: string;
  account: string;
};

type OgAttachment = {
  kind: "og";
  title: string;
  domain: string;
  status: string;
  website?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: string;
  customer: string;
  fromLabel: string;
  customerLabel: string;
  fromDetails: string[];
  customerDetails: string[];
};

type MessageAttachment =
  | ReceiptAttachment
  | MatchResultAttachment
  | OgAttachment;

type ChatMessage = {
  id: number;
  sender: "user" | "midday";
  text: string;
  status?: "read";
  attachment?: MessageAttachment;
};

type ScenarioStep = {
  sender: "user" | "midday";
  text: string;
  typingMs?: number;
  delayAfterMs?: number;
  attachment?: MessageAttachment;
};

export type ChatDemoScenario =
  | "reminder"
  | "create-invoice"
  | "receipt-match"
  | "latest-transactions";

const SCENARIO_ORDER: ChatDemoScenario[] = [
  "reminder",
  "create-invoice",
  "receipt-match",
  "latest-transactions",
];

type ScenarioConfig = {
  startOnLockScreen: boolean;
  notificationText?: string;
  notificationVisibleMs?: number;
  lockHoldMs?: number;
  transitionMs?: number;
  steps: ScenarioStep[];
};

type DemoBeat = {
  scenario: ChatDemoScenario;
  scrollThreshold: number;
  holdMs: number;
  messages: ChatMessage[];
  isTyping: boolean;
  readReceiptLabels: Record<number, string>;
  lockOpacity: number;
  chatOpacity: number;
  showNotification: boolean;
  notificationTapped: boolean;
  notificationText: string;
};

const SCENARIOS: Record<ChatDemoScenario, ScenarioConfig> = {
  reminder: {
    startOnLockScreen: true,
    notificationText:
      "Invoice #1042 is 14 days overdue — $2,400 from Acme Corp. Want me to send a reminder?",
    notificationVisibleMs: 1200,
    lockHoldMs: 1300,
    transitionMs: 350,
    steps: [
      {
        sender: "midday",
        text: "Invoice #1042 from Acme Corp ($2,400) is 14 days overdue. Want me to send a reminder?",
        typingMs: 800,
        delayAfterMs: 700,
      },
      {
        sender: "user",
        text: "Yes, send a reminder",
        delayAfterMs: 550,
      },
      {
        sender: "midday",
        text: "Done — reminder sent to john@acme.com with a payment link. I’ll keep watching for payment.",
        typingMs: 900,
        delayAfterMs: 1000,
      },
    ],
  },
  "create-invoice": {
    startOnLockScreen: false,
    steps: [
      {
        sender: "user",
        text: "Create an invoice for Linear — 40h at $150/h",
        delayAfterMs: 650,
      },
      {
        sender: "midday",
        text: "Invoice draft created for Linear — $6,000 total. Want me to send it now or schedule it?",
        typingMs: 1000,
        delayAfterMs: 950,
      },
      {
        sender: "user",
        text: "Send it now",
        delayAfterMs: 550,
      },
      {
        sender: "midday",
        text: "Sent. I’ll notify you when it’s viewed or paid.",
        typingMs: 900,
        attachment: {
          kind: "og",
          title: "Invoice #1043 | Linear",
          domain: "app.midday.ai",
          status: "Unpaid",
          website: "linear.app",
          invoiceNumber: "1043",
          issueDate: "Apr 5, 2026",
          dueDate: "Apr 19, 2026",
          amount: "$6,000",
          customer: "Linear",
          fromLabel: "From",
          customerLabel: "To",
          fromDetails: [
            "Midday Studios AB",
            "Regeringsgatan 25",
            "111 53 Stockholm",
            "billing@midday.ai",
            "+46 8 555 019 20",
          ],
          customerDetails: [
            "Linear Orbit, Inc.",
            "Attn: Finance Team",
            "2261 Market Street",
            "San Francisco, CA 94114",
            "ap@linear.app",
          ],
        },
        delayAfterMs: 1000,
      },
    ],
  },
  "receipt-match": {
    startOnLockScreen: false,
    steps: [
      {
        sender: "user",
        text: "",
        attachment: {
          kind: "receipt",
          title: "IMG_4821.HEIC",
          subtitle: "Hemköp receipt",
          amount: "SEK 1,018.35",
          imageSrc: "/images/chat-receipt-hemkop.png",
        },
        delayAfterMs: 700,
      },
      {
        sender: "midday",
        text: "Extracted data:\nMerchant: Hemköp\nTotal: SEK 1,018.35\nDate: Feb 25, 2026 at 16:02\nPayment method: Mastercard •••• 3185",
        typingMs: 1100,
        delayAfterMs: 750,
      },
      {
        sender: "midday",
        text: "Matched to Hemköp Odenplan for SEK 1,018.35 on Mastercard •••• 3185.",
        typingMs: 800,
        delayAfterMs: 1000,
      },
    ],
  },
  "latest-transactions": {
    startOnLockScreen: false,
    steps: [
      {
        sender: "user",
        text: "Show my latest transactions",
        delayAfterMs: 650,
      },
      {
        sender: "midday",
        text: "Latest activity:\n• Blue Bottle — $42.50\n• Vercel — $20.00\n• Stripe payout — +$4,820.00\n• Figma — $15.00",
        typingMs: 1000,
        delayAfterMs: 1100,
      },
      {
        sender: "user",
        text: "Flag anything unusual",
        delayAfterMs: 550,
      },
      {
        sender: "midday",
        text: "Nothing unusual today. The only notable change is that software spend is 12% higher than last week.",
        typingMs: 900,
        delayAfterMs: 1000,
      },
    ],
  },
};

const STABLE_READ_RECEIPTS: Record<ChatDemoScenario, string[]> = {
  reminder: ["Read 6:34 PM"],
  "create-invoice": ["Read 6:35 PM", "Read 6:36 PM"],
  "receipt-match": ["Read 6:37 PM"],
  "latest-transactions": ["Read 6:40 PM", "Read 6:41 PM"],
};

const MIDDAY_LOGO_PATH =
  "M21.22 4.763a13.07 13.07 0 0 1 0 8.265l-.774 2.318 2.873-2.546a10.54 10.54 0 0 0 3.333-5.771l.815-3.982 2.477.507-.815 3.982a13.07 13.07 0 0 1-4.132 7.157l-1.832 1.624 3.763-.77a10.541 10.541 0 0 0 5.773-3.332l2.696-3.04 1.892 1.677-2.696 3.04a13.07 13.07 0 0 1-7.158 4.132l-2.4.49 3.645 1.216a10.54 10.54 0 0 0 6.666 0l3.855-1.285.799 2.398-3.855 1.285a13.069 13.069 0 0 1-8.264 0l-2.32-.774 2.547 2.874a10.537 10.537 0 0 0 5.772 3.33l3.98.817-.506 2.477-3.981-.815a13.069 13.069 0 0 1-7.158-4.132l-1.622-1.83.77 3.761a10.537 10.537 0 0 0 3.33 5.772l3.04 2.696-1.677 1.891-3.04-2.696a13.066 13.066 0 0 1-4.132-7.156l-.49-2.397-1.214 3.642a10.54 10.54 0 0 0 0 6.666l1.285 3.855-2.4.8-1.285-3.855a13.069 13.069 0 0 1 0-8.265l.773-2.324-2.873 2.55a10.542 10.542 0 0 0-3.332 5.773l-.815 3.98-2.476-.508.814-3.98a13.07 13.07 0 0 1 4.132-7.157l1.83-1.625-3.761.77A10.539 10.539 0 0 0 7.3 29.603l-2.697 3.04-1.891-1.677 2.696-3.04a13.066 13.066 0 0 1 7.156-4.133l2.398-.492-3.643-1.213a10.54 10.54 0 0 0-6.666 0L.8 23.372 0 20.973l3.855-1.285a13.069 13.069 0 0 1 8.264 0l2.32.773-2.547-2.872a10.539 10.539 0 0 0-5.772-3.333l-3.98-.815.506-2.476 3.981.814a13.069 13.069 0 0 1 7.158 4.133l1.62 1.828-.767-3.76a10.537 10.537 0 0 0-3.332-5.771l-3.04-2.696 1.677-1.894 3.04 2.696a13.069 13.069 0 0 1 4.133 7.158l.49 2.399 1.215-3.644a10.54 10.54 0 0 0 0-6.666l-1.284-3.854 2.398-.8 1.285 3.855ZM20 16.957a3.953 3.953 0 0 0-3.951 3.951l.021.404a3.951 3.951 0 0 0 7.86 0l.02-.404-.02-.404a3.952 3.952 0 0 0-3.526-3.525L20 16.957Z";

function getWebsiteLogo(website?: string) {
  if (!website) {
    return "";
  }

  return `https://img.logo.dev/${website}?token=pk_X-1ZO13GSgeOoUrIuJ6GMQ&size=180&retina=true`;
}

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";
const SF_DISPLAY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";
const HIDE_SCROLLBAR_CSS = `
  [data-chat-scroll="true"]::-webkit-scrollbar {
    display: none;
  }
`;

function useIsDarkTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === "dark";
}



const HOLD_LOCK_SCREEN = 200;
const HOLD_NOTIFICATION_ENTER = 1800;
const HOLD_NOTIFICATION_TAP = 600;
const HOLD_CHAT_OPEN = 450;
const HOLD_USER_MESSAGE = 700;
const HOLD_READ_RECEIPT = 500;
const HOLD_TYPING = 750;
const HOLD_MIDDAY_MESSAGE = 850;
const HOLD_SCENARIO_BOUNDARY = 350;

function buildGlobalBeats(): DemoBeat[] {
  const beats: DemoBeat[] = [];
  const scenarioCount = SCENARIO_ORDER.length;
  let globalMessageId = 0;

  for (let si = 0; si < scenarioCount; si++) {
    const scenarioId = SCENARIO_ORDER[si]!;
    const config = SCENARIOS[scenarioId];
    const scrollBase = si;
    const notificationText =
      config.notificationText ??
      "Invoice #1042 is 14 days overdue — $2,400 from Acme Corp. Want me to send a reminder?";
    const readLabels = STABLE_READ_RECEIPTS[scenarioId];
    let userMsgCount = 0;

    const localBeats: Array<{
      holdMs: number;
      messages: ChatMessage[];
      isTyping: boolean;
      readReceiptLabels: Record<number, string>;
      lockOpacity: number;
      chatOpacity: number;
      showNotification: boolean;
      notificationTapped: boolean;
    }> = [];

    const currentMessages: ChatMessage[] = [];
    const currentReceipts: Record<number, string> = {};

    const snap = (
      holdMs: number,
      overrides?: Partial<{
        isTyping: boolean;
        lockOpacity: number;
        chatOpacity: number;
        showNotification: boolean;
        notificationTapped: boolean;
      }>,
    ) => {
      localBeats.push({
        holdMs,
        messages: [...currentMessages],
        isTyping: overrides?.isTyping ?? false,
        readReceiptLabels: { ...currentReceipts },
        lockOpacity: overrides?.lockOpacity ?? 0,
        chatOpacity: overrides?.chatOpacity ?? 1,
        showNotification: overrides?.showNotification ?? false,
        notificationTapped: overrides?.notificationTapped ?? false,
      });
    };

    if (config.startOnLockScreen) {
      snap(HOLD_LOCK_SCREEN, {
        lockOpacity: 1,
        chatOpacity: 0,
        showNotification: false,
      });

      snap(HOLD_NOTIFICATION_ENTER, {
        lockOpacity: 1,
        chatOpacity: 0,
        showNotification: true,
      });

      snap(HOLD_NOTIFICATION_TAP, {
        lockOpacity: 1,
        chatOpacity: 0,
        showNotification: true,
        notificationTapped: true,
      });

      const firstStep = config.steps[0];

      if (firstStep) {
        const msgId = globalMessageId++;
        currentMessages.push({
          id: msgId,
          sender: firstStep.sender,
          text: firstStep.text,
          attachment: firstStep.attachment,
        });

        if (firstStep.sender === "user") {
          const label =
            readLabels[userMsgCount] ??
            readLabels[readLabels.length - 1] ??
            "Read 6:34 PM";
          userMsgCount++;
          snap(HOLD_CHAT_OPEN, { lockOpacity: 0, chatOpacity: 1 });
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        } else {
          snap(HOLD_CHAT_OPEN, { lockOpacity: 0, chatOpacity: 1 });
        }
      } else {
        snap(HOLD_CHAT_OPEN, { lockOpacity: 0, chatOpacity: 1 });
      }

      for (let stepIdx = 1; stepIdx < config.steps.length; stepIdx++) {
        const step = config.steps[stepIdx]!;
        const msgId = globalMessageId++;

        if (step.sender === "midday" && step.typingMs) {
          snap(HOLD_TYPING, { isTyping: true });
        }

        currentMessages.push({
          id: msgId,
          sender: step.sender,
          text: step.text,
          attachment: step.attachment,
        });
        snap(step.sender === "user" ? HOLD_USER_MESSAGE : HOLD_MIDDAY_MESSAGE);

        if (step.sender === "user") {
          const label =
            readLabels[userMsgCount] ??
            readLabels[readLabels.length - 1] ??
            "Read 6:34 PM";
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        }
      }
    } else {
      const firstStep = config.steps[0];

      if (firstStep) {
        const msgId = globalMessageId++;
        currentMessages.push({
          id: msgId,
          sender: firstStep.sender,
          text: firstStep.text,
          attachment: firstStep.attachment,
        });
        snap(
          firstStep.sender === "user" ? HOLD_USER_MESSAGE : HOLD_MIDDAY_MESSAGE,
        );

        if (firstStep.sender === "user") {
          const label =
            readLabels[userMsgCount] ??
            readLabels[readLabels.length - 1] ??
            "Read 6:34 PM";
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        }
      }

      for (let stepIdx = 1; stepIdx < config.steps.length; stepIdx++) {
        const step = config.steps[stepIdx]!;
        const msgId = globalMessageId++;

        if (step.sender === "midday" && step.typingMs) {
          snap(HOLD_TYPING, { isTyping: true });
        }

        currentMessages.push({
          id: msgId,
          sender: step.sender,
          text: step.text,
          attachment: step.attachment,
        });
        snap(step.sender === "user" ? HOLD_USER_MESSAGE : HOLD_MIDDAY_MESSAGE);

        if (step.sender === "user") {
          const label =
            readLabels[userMsgCount] ??
            readLabels[readLabels.length - 1] ??
            "Read 6:34 PM";
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        }
      }
    }

    const beatCount = localBeats.length;

    for (let bi = 0; bi < beatCount; bi++) {
      const local = localBeats[bi]!;
      const scrollThreshold = scrollBase + bi / Math.max(beatCount - 1, 1);

      beats.push({
        scenario: scenarioId,
        scrollThreshold,
        holdMs:
          bi === beatCount - 1 && si < scenarioCount - 1
            ? HOLD_SCENARIO_BOUNDARY
            : local.holdMs,
        messages: local.messages,
        isTyping: local.isTyping,
        readReceiptLabels: local.readReceiptLabels,
        lockOpacity: local.lockOpacity,
        chatOpacity: local.chatOpacity,
        showNotification: local.showNotification,
        notificationTapped: local.notificationTapped,
        notificationText,
      });
    }
  }

  return beats;
}

/* ------------------------------------------------------------------ */
/*  Midday logo (inlined SVG, white on black)                          */
/* ------------------------------------------------------------------ */

function MiddayLogo({
  size,
  borderRadius,
}: {
  size: number;
  borderRadius: number | string;
}) {
  const iconScale = size * 0.55;
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius,
        background: "#000",
      }}
    >
      <svg width={iconScale} height={iconScale} viewBox="0 0 40 41" fill="#fff">
        <path d={MIDDAY_LOGO_PATH} />
      </svg>
    </div>
  );
}

function ContactAvatar({ size = 64 }: { size?: number }) {
  const logoSize = Math.round(size * 0.53);
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 50% 24%, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.04) 28%, rgba(0,0,0,0) 52%), #000",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.14), 0 10px 24px rgba(0,0,0,0.28)",
      }}
    >
      <svg
        width={logoSize}
        height={logoSize}
        viewBox="0 0 40 41"
        fill="#fff"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d={MIDDAY_LOGO_PATH} />
      </svg>
    </div>
  );
}

function HeaderBackIcon({ color }: { color: string }) {
  return (
    <svg
      width="10"
      height="17"
      viewBox="0 0 10 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.95 1.8L1.95 8.5L7.95 15.2"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeaderVideoIcon({ color }: { color: string }) {
  return (
    <svg
      width="19"
      height="15"
      viewBox="0 0 19 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M11.55 1.85H3.95C2.51 1.85 1.35 3.01 1.35 4.45V10.55C1.35 11.99 2.51 13.15 3.95 13.15H11.55C12.99 13.15 14.15 11.99 14.15 10.55V4.45C14.15 3.01 12.99 1.85 11.55 1.85Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.15 5.6L17.45 3.9V11.1L14.15 9.4V5.6Z"
        stroke={color}
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function HeaderDisclosureIcon({ color }: { color: string }) {
  return (
    <svg
      width="8"
      height="13"
      viewBox="0 0 8 13"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 1.5L6 6.5L2 11.5"
        stroke={color}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ComposerPlusIcon({ color }: { color: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M7.5 3.2V11.8M3.2 7.5H11.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ComposerMicIcon({ color }: { color: string }) {
  return (
    <svg
      width="12"
      height="16"
      viewBox="0 0 12 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6 10.2C7.546 10.2 8.8 8.946 8.8 7.4V4.2C8.8 2.654 7.546 1.4 6 1.4C4.454 1.4 3.2 2.654 3.2 4.2V7.4C3.2 8.946 4.454 10.2 6 10.2Z"
        stroke={color}
        strokeWidth="1.45"
      />
      <path
        d="M10.4 7.2V7.45C10.4 9.88 8.43 11.85 6 11.85C3.57 11.85 1.6 9.88 1.6 7.45V7.2"
        stroke={color}
        strokeWidth="1.45"
        strokeLinecap="round"
      />
      <path
        d="M6 11.85V15M3.6 15H8.4"
        stroke={color}
        strokeWidth="1.45"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LockFlashlightIcon({ color }: { color: string }) {
  return (
    <svg
      width="14"
      height="32"
      viewBox="0 0 14 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        opacity="0.9"
        d="M0 3.17871V2.79932C0 0.933105 0.912598 0 2.73779 0H10.6333C12.4585 0 13.3711 0.933105 13.3711 2.79932V3.17871H0ZM5.44482 31.6846C4.54932 31.6846 3.86914 31.4453 3.4043 30.9668C2.93945 30.4883 2.70703 29.791 2.70703 28.875V13.5044C2.70703 12.7866 2.63184 12.1782 2.48145 11.6792C2.33105 11.1733 2.12939 10.7222 1.87646 10.3257L1.10742 9.14648C0.786133 8.63379 0.519531 8.13135 0.307617 7.63916C0.102539 7.14014 0 6.58643 0 5.97803V4.92188H13.3711V5.97803C13.3711 6.58643 13.2651 7.14014 13.0532 7.63916C12.8481 8.13135 12.5815 8.63379 12.2534 9.14648L11.4946 10.3257C11.2417 10.7222 11.04 11.1733 10.8896 11.6792C10.7393 12.1782 10.6641 12.7866 10.6641 13.5044V28.875C10.6641 29.791 10.4282 30.4883 9.95654 30.9668C9.4917 31.4453 8.81494 31.6846 7.92627 31.6846H5.44482ZM4.25537 14.6733V18.8877C4.25537 19.5713 4.48779 20.1455 4.95264 20.6104C5.42432 21.0752 6.00537 21.3076 6.6958 21.3076C7.14697 21.3076 7.55371 21.2017 7.91602 20.9897C8.28516 20.7778 8.57568 20.4907 8.7876 20.1284C9.00635 19.7593 9.11572 19.3457 9.11572 18.8877V14.6733C9.11572 14.2222 9.00635 13.8154 8.7876 13.4531C8.57568 13.084 8.28516 12.7935 7.91602 12.5815C7.55371 12.3628 7.14697 12.2534 6.6958 12.2534C6.00537 12.2534 5.42432 12.4893 4.95264 12.9609C4.48779 13.4258 4.25537 13.9966 4.25537 14.6733ZM6.6958 20.4565C6.24463 20.4565 5.86865 20.3096 5.56787 20.0156C5.26709 19.7148 5.1167 19.3389 5.1167 18.8877C5.1167 18.457 5.26709 18.0913 5.56787 17.7905C5.87549 17.4829 6.25146 17.3291 6.6958 17.3291C7.12646 17.3291 7.49561 17.4829 7.80322 17.7905C8.11084 18.0913 8.26465 18.457 8.26465 18.8877C8.26465 19.3389 8.11426 19.7148 7.81348 20.0156C7.5127 20.3096 7.14014 20.4565 6.6958 20.4565Z"
        fill={color}
        style={{ mixBlendMode: "plus-lighter" }}
      />
    </svg>
  );
}

function LockCameraIcon({ color }: { color: string }) {
  return (
    <svg
      width="33"
      height="26"
      viewBox="0 0 33 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        opacity="0.9"
        d="M27.3984 10.582C27.8906 10.582 28.3076 10.4111 28.6494 10.0693C28.998 9.7207 29.1724 9.30029 29.1724 8.80811C29.1724 8.32959 28.998 7.91602 28.6494 7.56738C28.3008 7.21875 27.8838 7.04443 27.3984 7.04443C26.9131 7.04443 26.4961 7.21875 26.1475 7.56738C25.7988 7.91602 25.6245 8.32959 25.6245 8.80811C25.6245 9.30029 25.7988 9.7207 26.1475 10.0693C26.4961 10.4111 26.9131 10.582 27.3984 10.582ZM4.51172 25.8296C3.04883 25.8296 1.93115 25.4468 1.15869 24.6812C0.38623 23.9155 0 22.8047 0 21.3486V7.42383C0 5.97461 0.38623 4.86719 1.15869 4.10156C1.93115 3.33594 3.04883 2.95312 4.51172 2.95312H7.71094C8.05273 2.95312 8.33301 2.93262 8.55176 2.8916C8.77734 2.84375 8.98242 2.76172 9.16699 2.64551C9.35156 2.52246 9.55664 2.34473 9.78223 2.1123L10.8281 1.0459C11.0742 0.799805 11.3237 0.601562 11.5767 0.451172C11.8364 0.300781 12.1235 0.187988 12.438 0.112793C12.7593 0.0375977 13.1387 0 13.5762 0H19.1748C19.6123 0 19.9917 0.0375977 20.313 0.112793C20.6343 0.187988 20.9214 0.300781 21.1743 0.451172C21.4272 0.601562 21.6733 0.799805 21.9126 1.0459L22.9585 2.1123C23.1909 2.34473 23.3994 2.52246 23.584 2.64551C23.7686 2.76172 23.9702 2.84375 24.189 2.8916C24.4146 2.93262 24.6982 2.95312 25.04 2.95312H28.3213C29.7773 2.95312 30.8916 3.33594 31.6641 4.10156C32.4365 4.86719 32.8228 5.97461 32.8228 7.42383V21.3486C32.8228 22.8047 32.4365 23.9155 31.6641 24.6812C30.8916 25.4468 29.7773 25.8296 28.3213 25.8296H4.51172ZM16.4165 21.4819C17.394 21.4819 18.3101 21.2974 19.1646 20.9282C20.019 20.5659 20.7676 20.0635 21.4102 19.4209C22.0596 18.7715 22.5654 18.0195 22.9277 17.165C23.2969 16.3037 23.4814 15.3809 23.4814 14.3965C23.4814 13.4121 23.3003 12.4927 22.938 11.6382C22.5757 10.7837 22.0698 10.0317 21.4204 9.38232C20.7778 8.73291 20.0259 8.22705 19.1646 7.86475C18.3101 7.49561 17.394 7.31104 16.4165 7.31104C15.439 7.31104 14.5195 7.49561 13.6582 7.86475C12.8037 8.22705 12.0518 8.73291 11.4023 9.38232C10.7598 10.0317 10.2573 10.7837 9.89502 11.6382C9.53271 12.4927 9.35156 13.4121 9.35156 14.3965C9.35156 15.3809 9.53271 16.3037 9.89502 17.165C10.2573 18.0195 10.7598 18.7715 11.4023 19.4209C12.0518 20.0635 12.8037 20.5659 13.6582 20.9282C14.5195 21.2974 15.439 21.4819 16.4165 21.4819ZM16.4165 18.7954C15.8081 18.7954 15.2373 18.6826 14.7041 18.457C14.1777 18.2246 13.7129 17.9102 13.3096 17.5137C12.9131 17.1104 12.5986 16.6421 12.3662 16.1089C12.1406 15.5757 12.0278 15.0049 12.0278 14.3965C12.0278 13.7881 12.1406 13.2173 12.3662 12.6841C12.5986 12.1509 12.9131 11.6826 13.3096 11.2793C13.7129 10.876 14.1777 10.5615 14.7041 10.3359C15.2373 10.1104 15.8081 9.99756 16.4165 9.99756C17.0249 9.99756 17.5923 10.1104 18.1187 10.3359C18.6519 10.5615 19.1167 10.876 19.5132 11.2793C19.9165 11.6826 20.231 12.1509 20.4565 12.6841C20.6821 13.2173 20.7949 13.7881 20.7949 14.3965C20.7949 15.0049 20.6821 15.5757 20.4565 16.1089C20.231 16.6421 19.9165 17.1104 19.5132 17.5137C19.1167 17.9102 18.6519 18.2246 18.1187 18.457C17.5923 18.6826 17.0249 18.7954 16.4165 18.7954Z"
        fill={color}
        style={{ mixBlendMode: "plus-lighter" }}
      />
    </svg>
  );
}

function LiquidGlass({
  children,
  borderRadius,
  padding,
  className,
  style,
}: {
  children: ReactNode;
  borderRadius: number | string;
  padding?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius,
        padding,
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025))",
        backdropFilter: "blur(14px) saturate(126%)",
        WebkitBackdropFilter: "blur(14px) saturate(126%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(255,255,255,0.015), 0 6px 16px rgba(0,0,0,0.08)",
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(115deg, transparent 12%, rgba(255,255,255,0.12) 28%, rgba(255,255,255,0.04) 40%, transparent 58%)",
          mixBlendMode: "screen",
          opacity: 0.34,
          filter: "url(#liquid-glass-distortion)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.1), transparent 34%), radial-gradient(circle at 80% 100%, rgba(255,255,255,0.035), transparent 28%)",
          pointerEvents: "none",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          padding: "0.5px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0.08))",
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          pointerEvents: "none",
          opacity: 0.9,
        }}
      />
      <div style={{ display: "contents" }}>{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status bar (rendered inside the screen, adapts to light/dark)     */
/* ------------------------------------------------------------------ */

function StatusBar({ dark }: { dark?: boolean }) {
  const color = dark ? "#000" : "#fff";

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-between"
      style={{ height: 54, padding: "14px 28px 0", zIndex: 20 }}
    >
      <span
        style={{
          color,
          fontSize: 17,
          fontWeight: 600,
          fontFamily: SF_FONT,
          letterSpacing: 0.2,
        }}
      >
        9:41 AM
      </span>

      <svg
        width="78"
        height="14"
        viewBox="0 0 78 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="9" width="3.2" height="4.5" rx="0.8" fill={color} />
        <rect x="4.6" y="6.5" width="3.2" height="7" rx="0.8" fill={color} />
        <rect x="9.2" y="4" width="3.2" height="9.5" rx="0.8" fill={color} />
        <rect x="13.8" y="0.5" width="3.2" height="13" rx="0.8" fill={color} />
        <g transform="translate(22, 0)" fill={color}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M7.5 2.3C9.7 2.3 11.8 3.1 13.4 4.6L14.4 3.5C12.5 1.7 10 0.7 7.5 0.7C5 0.7 2.5 1.7 0.6 3.5L1.6 4.6C3.2 3.1 5.3 2.3 7.5 2.3ZM7.5 6.5C8.7 6.5 9.8 7 10.7 7.8L11.7 6.6C10.5 5.5 9 4.9 7.5 4.9C6 4.9 4.5 5.5 3.3 6.6L4.3 7.8C5.2 7 6.3 6.5 7.5 6.5ZM9.3 10.2L7.5 12.3L5.7 10.2C6.2 9.7 6.8 9.3 7.5 9.3C8.2 9.3 8.8 9.7 9.3 10.2Z"
          />
        </g>
        <g transform="translate(50, 1)">
          <rect
            x="0"
            y="0"
            width="24"
            height="12"
            rx="3.8"
            stroke={color}
            strokeOpacity="0.35"
            fill="none"
          />
          <path
            d="M25.5 4.3V8.4C26.2 8.1 26.6 7.4 26.6 6.4C26.6 5.4 26.2 4.6 25.5 4.3Z"
            fill={color}
            opacity="0.4"
          />
          <rect x="1.5" y="1.5" width="21" height="9" rx="2.5" fill={color} />
        </g>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Home indicator bar                                                 */
/* ------------------------------------------------------------------ */

function HomeIndicator({ dark }: { dark?: boolean }) {
  return (
    <div
      className="absolute bottom-0 left-0 right-0 flex justify-center"
      style={{ paddingBottom: 8, zIndex: 20 }}
    >
      <div
        style={{
          width: 134,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: dark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.5)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lock screen — iOS 26 Liquid Glass                                  */
/* ------------------------------------------------------------------ */

function LockScreen() {
  const timeStr = "9:41";
  const dateStr = "Sunday, April 5";

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <img
        src="/images/chat-lock-wallpaper.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "rgba(255,255,255,0.02)", zIndex: 1 }}
      />

      <StatusBar />
      <HomeIndicator />

      {/* Lock screen clock */}
      <div
        style={{
          marginTop: 72,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            fontSize: 21,
            fontWeight: 600,
            color: "rgba(255,255,255,0.94)",
            fontFamily: SF_FONT,
            letterSpacing: -0.35,
            textShadow: "0 1px 10px rgba(255,255,255,0.08)",
          }}
        >
          {dateStr}
        </div>

        <div
          style={{
            position: "relative",
            marginTop: -6,
            minWidth: 352,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              fontSize: 188,
              fontWeight: 200,
              color: "rgba(235,244,255,0.24)",
              fontFamily: SF_DISPLAY,
              lineHeight: 0.86,
              letterSpacing: -12,
              textAlign: "center",
              filter: "blur(6px)",
              transform: "translateY(1px)",
              pointerEvents: "none",
            }}
          >
            {timeStr}
          </div>
          <div
            style={{
              position: "relative",
              fontSize: 188,
              fontWeight: 200,
              color: "rgba(245,249,255,0.52)",
              fontFamily: SF_DISPLAY,
              lineHeight: 0.86,
              letterSpacing: -12,
              textAlign: "center",
              textShadow:
                "0 1px 0 rgba(255,255,255,0.32), 0 0 18px rgba(255,255,255,0.07)",
              WebkitTextStroke: "0.45px rgba(255,255,255,0.3)",
            }}
          >
            {timeStr}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.78) 0%, rgba(232,241,255,0.42) 48%, rgba(210,225,255,0.12) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              fontSize: 188,
              fontWeight: 200,
              fontFamily: SF_DISPLAY,
              lineHeight: 0.86,
              letterSpacing: -12,
              textAlign: "center",
              opacity: 0.84,
              mixBlendMode: "screen",
              pointerEvents: "none",
            }}
          >
            {timeStr}
          </div>

          <div
            style={{
              position: "absolute",
              inset: 0,
              color: "rgba(255,255,255,0.24)",
              fontSize: 188,
              fontWeight: 200,
              fontFamily: SF_DISPLAY,
              lineHeight: 0.86,
              letterSpacing: -12,
              textAlign: "center",
              mixBlendMode: "color-dodge",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          >
            {timeStr}
          </div>
        </div>
      </div>

      {/* iOS 26 bottom controls — flashlight & camera (Liquid Glass circles) */}
      <div
        className="absolute flex items-center justify-between"
        style={{
          bottom: 24,
          left: 48,
          right: 48,
          zIndex: 10,
        }}
      >
        {/* Flashlight */}
        <LiquidGlass
          borderRadius="50%"
          className="flex items-center justify-center"
          style={{ width: 48, height: 48 }}
        >
          <div
            className="flex items-center justify-center"
            style={{ transform: "scale(0.64)" }}
          >
            <LockFlashlightIcon color="rgba(255,255,255,0.94)" />
          </div>
        </LiquidGlass>

        {/* Camera */}
        <LiquidGlass
          borderRadius="50%"
          className="flex items-center justify-center"
          style={{ width: 48, height: 48 }}
        >
          <div
            className="flex items-center justify-center"
            style={{ transform: "scale(0.48)" }}
          >
            <LockCameraIcon color="rgba(255,255,255,0.94)" />
          </div>
        </LiquidGlass>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification banner — iOS 26 Liquid Glass                          */
/* ------------------------------------------------------------------ */

function NotificationBanner({
  tapped,
  body,
}: {
  tapped: boolean;
  body: string;
}) {
  return (
    <motion.div
      initial={{ y: 300, opacity: 0, scale: 0.94, filter: "blur(10px)" }}
      animate={
        tapped
          ? { y: -96, opacity: 0, scale: 0.96, filter: "blur(6px)" }
          : { y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }
      }
      transition={
        tapped
          ? { duration: 0.25, ease: "easeIn" }
          : { type: "spring", damping: 26, stiffness: 220, mass: 1.05 }
      }
      className="absolute"
      style={{
        bottom: 96,
        left: 16,
        right: 16,
        zIndex: 30,
      }}
    >
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 110, scale: 0.98 }}
        animate={
          tapped
            ? { opacity: 0, y: 44, scale: 0.98 }
            : { opacity: 0.22, y: 340, scale: 1 }
        }
        transition={{ type: "spring", damping: 28, stiffness: 210 }}
        className="absolute left-0 right-0"
        style={{
          height: 64,
          borderRadius: 24,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.06))",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.18), 0 20px 40px rgba(0,0,0,0.12)",
        }}
      />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: 165, scale: 0.96 }}
        animate={
          tapped
            ? { opacity: 0, y: 72, scale: 0.96 }
            : { opacity: 0.14, y: 256, scale: 1 }
        }
        transition={{ type: "spring", damping: 28, stiffness: 210 }}
        className="absolute left-5 right-5"
        style={{
          height: 64,
          borderRadius: 24,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 34px rgba(0,0,0,0.1)",
        }}
      />

      <div
        className="relative flex items-start gap-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.1))",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRadius: 24,
          padding: "12px 14px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(0,0,0,0.15)",
        }}
      >
        <MiddayLogo size={38} borderRadius={9} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: 13.5,
                fontWeight: 600,
                color: "rgba(255,255,255,0.9)",
                fontFamily: SF_FONT,
              }}
            >
              Midday
            </span>
            <span
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.45)",
                fontFamily: SF_FONT,
              }}
            >
              now
            </span>
          </div>
          <p
            className="mt-0.5"
            style={{
              fontSize: 13.5,
              lineHeight: 1.35,
              color: "rgba(255,255,255,0.75)",
              fontFamily: SF_FONT,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Typing indicator (three bouncing dots)                             */
/* ------------------------------------------------------------------ */

function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex items-start" style={{ padding: "4px 16px" }}>
      <div
        className="flex items-center gap-1"
        style={{
          background: isDark ? "#2C2C2E" : "#E9E9EB",
          borderRadius: "18px 18px 18px 4px",
          padding: "10px 14px",
          height: 36,
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              backgroundColor: isDark ? "#A1A1AA" : "#8E8E93",
            }}
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Receipt preview bubble                                             */
/* ------------------------------------------------------------------ */

function ReceiptPreview({
  attachment,
  isUser,
}: {
  attachment: ReceiptAttachment;
  isUser: boolean;
}) {
  if (isUser) {
    return (
      <div
        style={{
          borderRadius: 18,
          overflow: "hidden",
          background: "#0E0E10",
          boxShadow: "0 10px 24px rgba(0,0,0,0.22)",
          width: "100%",
        }}
      >
        <img
          src={attachment.imageSrc}
          alt={attachment.subtitle}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 14,
        overflow: "hidden",
        background: isUser
          ? "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,248,252,0.94))"
          : "linear-gradient(180deg, rgba(255,255,255,0.92), rgba(245,245,247,0.88))",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          padding: "11px 11px 10px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.9), rgba(248,250,252,0.86))",
        }}
      >
        <div
          style={{
            borderRadius: 10,
            background: "#FFFFFF",
            padding: "10px 9px",
            minWidth: 150,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#111827",
              fontFamily: SF_FONT,
              letterSpacing: -0.2,
            }}
          >
            {attachment.subtitle}
          </div>
          <div
            style={{
              marginTop: 6,
              display: "grid",
              gap: 4,
            }}
          >
            {[40, 56, 34, 62, 48].map((width, index) => (
              <div
                key={`${attachment.title}-${width}-${index}`}
                style={{
                  height: index === 4 ? 7 : 5,
                  width,
                  borderRadius: 999,
                  background:
                    index === 4
                      ? "rgba(59,130,246,0.75)"
                      : "rgba(148,163,184,0.28)",
                }}
              />
            ))}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 13,
              fontWeight: 700,
              color: "#111827",
              fontFamily: SF_FONT,
            }}
          >
            {attachment.amount}
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "8px 10px 9px",
          background: "rgba(241,245,249,0.72)",
          borderTop: "1px solid rgba(148,163,184,0.18)",
        }}
      >
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "#111827",
            fontFamily: SF_FONT,
            letterSpacing: -0.15,
          }}
        >
          {attachment.title}
        </div>
      </div>
    </div>
  );
}

function MatchResultPreview({
  attachment,
}: {
  attachment: MatchResultAttachment;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(247,247,249,0.94))",
        border: "1px solid rgba(15,23,42,0.08)",
        boxShadow: "0 8px 18px rgba(15,23,42,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 11px 9px",
          borderBottom: "1px solid rgba(148,163,184,0.14)",
        }}
      >
        <div
          style={{
            fontFamily: SF_FONT,
            fontSize: 12.5,
            lineHeight: 1.1,
            fontWeight: 700,
            color: "#111827",
            letterSpacing: -0.18,
          }}
        >
          {attachment.title}
        </div>
        {attachment.status ? (
          <div
            style={{
              borderRadius: 999,
              padding: "3px 7px",
              background:
                attachment.status === "Matched"
                  ? "rgba(34,197,94,0.12)"
                  : "rgba(59,130,246,0.12)",
              color: attachment.status === "Matched" ? "#15803D" : "#1D4ED8",
              fontFamily: SF_FONT,
              fontSize: 10.5,
              lineHeight: 1,
              fontWeight: 700,
              letterSpacing: -0.08,
            }}
          >
            {attachment.status}
          </div>
        ) : null}
      </div>

      <div
        style={{
          padding: "10px 11px 11px",
          display: "grid",
          gap: 10,
        }}
      >
        <div
          style={{
            borderRadius: 12,
            background:
              "linear-gradient(180deg, rgba(248,250,252,0.98), rgba(241,245,249,0.94))",
            border: "1px solid rgba(148,163,184,0.16)",
            padding: "10px 10px 9px",
            display: "grid",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SF_FONT,
                  fontSize: 10.5,
                  lineHeight: 1,
                  color: "#6B7280",
                  fontWeight: 600,
                  letterSpacing: -0.08,
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                Merchant
              </div>
              <div
                style={{
                  fontFamily: SF_FONT,
                  fontSize: 15,
                  lineHeight: 1.1,
                  color: "#111827",
                  fontWeight: 700,
                  letterSpacing: -0.2,
                }}
              >
                {attachment.merchant}
              </div>
            </div>

            <div style={{ textAlign: "right", minWidth: 0 }}>
              <div
                style={{
                  fontFamily: SF_FONT,
                  fontSize: 10.5,
                  lineHeight: 1,
                  color: "#6B7280",
                  fontWeight: 600,
                  letterSpacing: -0.08,
                  marginBottom: 4,
                  textTransform: "uppercase",
                }}
              >
                Total
              </div>
              <div
                style={{
                  fontFamily: SF_DISPLAY,
                  fontSize: 17,
                  lineHeight: 1,
                  color: "#111827",
                  fontWeight: 700,
                  letterSpacing: -0.32,
                }}
              >
                {attachment.total}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
              gap: 8,
            }}
          >
            {[
              ["Date", attachment.date],
              ["Account", attachment.account],
            ].map(([label, value]) => (
              <div
                key={label}
                style={{
                  borderRadius: 10,
                  background: "#FFFFFF",
                  border: "1px solid rgba(148,163,184,0.14)",
                  padding: "8px 9px",
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontFamily: SF_FONT,
                    fontSize: 10,
                    lineHeight: 1,
                    color: "#6B7280",
                    fontWeight: 600,
                    letterSpacing: -0.08,
                    marginBottom: 5,
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontFamily: SF_FONT,
                    fontSize: 11.5,
                    lineHeight: 1.2,
                    color: "#111827",
                    fontWeight: 600,
                    letterSpacing: -0.12,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </div>

        {[["Matched transaction", attachment.transaction]].map(
          ([label, value]) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: "120px minmax(0, 1fr)",
                alignItems: "start",
                gap: 8,
              }}
            >
              <div
                style={{
                  fontFamily: SF_FONT,
                  fontSize: 11,
                  lineHeight: 1.2,
                  color: "#6B7280",
                  fontWeight: 600,
                  letterSpacing: -0.1,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: SF_FONT,
                  fontSize: 11.5,
                  lineHeight: 1.25,
                  color: "#111827",
                  fontWeight: 600,
                  letterSpacing: -0.14,
                  wordBreak: "break-word",
                }}
              >
                {value}
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

function InvoiceOgArtwork({ attachment }: { attachment: OgAttachment }) {
  return (
    <div
      style={{
        aspectRatio: "1.72 / 1",
        width: "100%",
        borderRadius: 0,
        overflow: "hidden",
        background: "#131313",
        padding: "10px 12px 9px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          {attachment.website ? (
            <img
              src={getWebsiteLogo(attachment.website)}
              alt={attachment.customer}
              style={{
                width: 15,
                height: 15,
                borderRadius: 2,
                background: "#FFFFFF",
                objectFit: "contain",
                overflow: "hidden",
              }}
            />
          ) : (
            <div
              style={{
                width: 15,
                height: 15,
                borderRadius: 2,
                background: "#FFFFFF",
                color: "#111111",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: SF_FONT,
                fontSize: 8,
                fontWeight: 700,
              }}
            >
              {attachment.customer.slice(0, 1)}
            </div>
          )}
        </div>
        <div
          style={{
            borderRadius: 999,
            padding: "2px 6px",
            background: "rgba(255,255,255,0.14)",
            color: "#F5F5F3",
            fontFamily: SF_FONT,
            fontSize: 7.5,
            fontWeight: 500,
            letterSpacing: -0.06,
            lineHeight: 1,
          }}
        >
          {attachment.status}
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          columnGap: 10,
          rowGap: 0,
          marginBottom: 9,
        }}
      >
        {[
          ["Invoice No", `INV-${attachment.invoiceNumber}`],
          ["Issue Date", attachment.issueDate],
          ["Due Date", attachment.dueDate],
        ].map(([label, value]) => (
          <div key={label} style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: SF_FONT,
                fontSize: 5.4,
                lineHeight: 1.15,
                color: "rgba(255,255,255,0.52)",
                marginBottom: 2,
                letterSpacing: -0.05,
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontFamily: SF_FONT,
                fontSize: 6.4,
                lineHeight: 1.15,
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: -0.04,
              }}
            >
              {value}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          columnGap: 14,
          alignItems: "start",
        }}
      >
        {(
          [
            [attachment.fromLabel, attachment.fromDetails],
            [attachment.customerLabel, attachment.customerDetails],
          ] as const
        ).map(([label, lines]) => (
          <div key={label} style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: SF_FONT,
                fontSize: 5.4,
                lineHeight: 1.15,
                color: "rgba(255,255,255,0.52)",
                marginBottom: 2,
                letterSpacing: -0.05,
                textTransform: "uppercase",
              }}
            >
              {label}
            </div>
            <div style={{ display: "grid", gap: 1 }}>
              {lines.slice(0, 3).map((line) => (
                <div
                  key={line}
                  style={{
                    fontFamily: SF_FONT,
                    fontSize: 6.4,
                    lineHeight: 1.15,
                    color: "#FFFFFF",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    letterSpacing: -0.04,
                  }}
                >
                  {line}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function OgLinkPreview({ attachment }: { attachment: OgAttachment }) {
  return (
    <div
      style={{
        borderRadius: 18,
        overflow: "hidden",
        background: "#2B2B2F",
      }}
    >
      <InvoiceOgArtwork attachment={attachment} />
      <div
        style={{
          padding: "11px 14px 12px",
          background: "#36363A",
          display: "grid",
          gap: 2,
        }}
      >
        <div
          style={{
            fontFamily: SF_FONT,
            fontSize: 11.5,
            lineHeight: 1.14,
            color: "#FFFFFF",
            fontWeight: 500,
            letterSpacing: -0.24,
            maxWidth: "90%",
          }}
        >
          {attachment.title}
        </div>
        <div
          style={{
            fontFamily: SF_FONT,
            fontSize: 10,
            lineHeight: 1.2,
            color: "#9B9BA0",
            letterSpacing: -0.1,
          }}
        >
          {attachment.domain}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Message bubble                                                     */
/* ------------------------------------------------------------------ */

function MessageBubble({
  message,
  isDark,
  statusLabel,
}: {
  message: ChatMessage;
  isDark: boolean;
  statusLabel?: string;
}) {
  const isUser = message.sender === "user";
  const isOgPreview = message.attachment?.kind === "og";
  const isMatchResult = message.attachment?.kind === "match-result";
  const isReceiptImageOnly = isUser && message.attachment?.kind === "receipt";
  const isOgPreviewWithMessage = isOgPreview && Boolean(message.text);
  const bubbleBackground = isUser ? "#007AFF" : isDark ? "#2C2C2E" : "#E9E9EB";
  const bubbleTextColor = isUser ? "#FFFFFF" : isDark ? "#FFFFFF" : "#000000";
  return (
    <div
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ padding: "2px 8px" }}
    >
      <div
        style={{
          maxWidth: isOgPreview
            ? "88%"
            : isMatchResult
              ? "86%"
              : isReceiptImageOnly
                ? "74%"
                : "84%",
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "visible",
            padding: isOgPreview
              ? isOgPreviewWithMessage
                ? "8px"
                : 0
              : isMatchResult
                ? "8px"
                : isReceiptImageOnly
                  ? 0
                  : message.attachment
                    ? "8px"
                    : "10px 15px",
            fontSize: 17,
            lineHeight: 1.22,
            color: isOgPreview
              ? isDark
                ? "#fff"
                : "#000"
              : isMatchResult
                ? isDark
                  ? "#fff"
                  : "#000"
                : isReceiptImageOnly
                  ? isDark
                    ? "#fff"
                    : "#000"
                  : bubbleTextColor,
            backgroundColor: isOgPreview
              ? isOgPreviewWithMessage
                ? isDark
                  ? "#2C2C2E"
                  : "#E9E9EB"
                : "transparent"
              : isMatchResult
                ? isDark
                  ? "#2C2C2E"
                  : "#E9E9EB"
                : isReceiptImageOnly
                  ? "transparent"
                  : bubbleBackground,
            borderRadius: isOgPreview
              ? isOgPreviewWithMessage
                ? "20px 20px 20px 6px"
                : 0
              : isMatchResult
                ? "20px 20px 20px 6px"
                : isReceiptImageOnly
                  ? 0
                  : isUser
                    ? "20px 20px 6px 20px"
                    : "20px 20px 20px 6px",
            fontFamily: SF_FONT,
          }}
        >
          {message.attachment ? (
            <div
              style={{
                position: "relative",
                zIndex: 1,
                display: "grid",
                gap: message.text ? 10 : 0,
              }}
            >
              {message.attachment.kind === "receipt" ? (
                <ReceiptPreview
                  attachment={message.attachment}
                  isUser={isUser}
                />
              ) : message.attachment.kind === "match-result" ? (
                <MatchResultPreview attachment={message.attachment} />
              ) : (
                <OgLinkPreview attachment={message.attachment} />
              )}
              {message.text ? (
                <div
                  style={{ padding: isOgPreview ? "0 6px 2px" : "0 4px 1px" }}
                >
                  {message.text}
                </div>
              ) : null}
            </div>
          ) : (
            message.text
          )}
        </div>
        {isUser ? (
          <div
            style={{
              height: 16,
              marginTop: 5,
              paddingRight: 2,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <AnimatePresence initial={false}>
              {statusLabel ? (
                <motion.div
                  key={`receipt-${message.id}`}
                  initial={{ opacity: 0, y: -3, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -2, filter: "blur(3px)" }}
                  transition={{
                    duration: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  style={{
                    position: "absolute",
                    top: 0,
                    right: 4,
                    textAlign: "right",
                    fontSize: 12,
                    lineHeight: 1,
                    fontWeight: 500,
                    color: isDark
                      ? "rgba(255,255,255,0.38)"
                      : "rgba(60,60,67,0.62)",
                    fontFamily: SF_FONT,
                    letterSpacing: -0.1,
                    willChange: "transform, opacity, filter",
                  }}
                >
                  {statusLabel}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat view — iOS 26 Liquid Glass iMessage                           */
/* ------------------------------------------------------------------ */

function ChatView({
  messages,
  isTyping,
  readReceiptLabels,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  readReceiptLabels: Record<number, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkTheme();
  const headerBackground = isDark ? "#000000" : "#FFFFFF";
  const controlIconColor = isDark ? "#FFFFFF" : "#111111";
  const metaColor = isDark ? "rgba(255,255,255,0.62)" : "rgba(60,60,67,0.72)";
  const detailColor = isDark ? "rgba(255,255,255,0.4)" : "rgba(60,60,67,0.56)";
  const composerShell = "transparent";
  const composerIconColor = isDark ? "rgba(255,255,255,0.58)" : "#6B7280";
  const composerPlusIconColor = isDark ? "#FFFFFF" : "#000000";
  const composerPlaceholderColor = isDark ? "#8E8E93" : "#8E8E93";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        background: isDark ? "#000000" : "#FFFFFF",
        color: isDark ? "#FFFFFF" : "#000000",
      }}
    >
      <StatusBar dark={!isDark} />

      {/* Header matching iOS screenshot */}
      <div
        className="relative"
        style={{
          marginTop: 48,
          padding: "6px 14px 12px",
          background: headerBackground,
        }}
      >
        <div className="flex items-center justify-between">
          <LiquidGlass
            borderRadius="50%"
            className="flex items-center justify-center"
            style={{ width: 36, height: 36 }}
          >
            <HeaderBackIcon color={controlIconColor} />
          </LiquidGlass>

          <div
            className="flex items-center justify-center"
            style={{ width: 36, minWidth: 36 }}
          >
            <LiquidGlass
              borderRadius="50%"
              className="flex items-center justify-center"
              style={{ width: 36, height: 36 }}
            >
              <HeaderVideoIcon color={controlIconColor} />
            </LiquidGlass>
          </div>
        </div>

        <div className="flex flex-col items-center" style={{ marginTop: -30 }}>
          <ContactAvatar size={56} />

          <LiquidGlass
            borderRadius={16}
            style={{
              marginTop: 8,
              minHeight: 33,
              padding: "0 15px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: isDark ? "#FFFFFF" : "#000000",
                fontFamily: SF_FONT,
                letterSpacing: -0.2,
              }}
            >
              Midday
            </span>
            <HeaderDisclosureIcon color={detailColor} />
          </LiquidGlass>

          <div
            style={{
              marginTop: 10,
              fontSize: 14,
              fontWeight: 400,
              color: metaColor,
              fontFamily: SF_FONT,
              lineHeight: 1.2,
            }}
          >
            iMessage
          </div>
          <div
            className="flex items-center gap-1"
            style={{
              marginTop: 2,
              fontSize: 12,
              fontWeight: 400,
              color: detailColor,
              fontFamily: SF_FONT,
              lineHeight: 1,
            }}
          >
            <svg
              width="8"
              height="10"
              viewBox="0 0 8 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="1.4"
                y="4.3"
                width="5.2"
                height="4.3"
                rx="1.1"
                fill={detailColor}
              />
              <path
                d="M2.4 4.3V3.3C2.4 2.24 3.11 1.4 4 1.4C4.89 1.4 5.6 2.24 5.6 3.3V4.3"
                stroke={detailColor}
                strokeWidth="1"
                strokeLinecap="round"
              />
            </svg>
            <span>Encrypted</span>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        data-chat-scroll="true"
        style={{
          paddingTop: 6,
          paddingBottom: 8,
          background: isDark ? "#000000" : "#FFFFFF",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          overscrollBehaviorY: "contain",
          touchAction: "pan-y",
        }}
      >
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isDark={isDark}
                statusLabel={
                  msg.sender === "user" ? readReceiptLabels[msg.id] : undefined
                }
              />
            ))}
          </AnimatePresence>
          {isTyping && <TypingIndicator isDark={isDark} />}
        </div>
      </div>

      {/* iOS Messages composer */}
      <div
        className="flex items-center gap-[8px]"
        style={{
          padding: "8px 14px 36px",
          background: composerShell,
        }}
      >
        <LiquidGlass
          borderRadius="50%"
          className="flex items-center justify-center"
          style={{
            width: 36,
            height: 36,
          }}
        >
          <ComposerPlusIcon color={composerPlusIconColor} />
        </LiquidGlass>
        <LiquidGlass
          borderRadius={18}
          className="flex-1"
          style={{
            height: 36,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(255,255,255,0.008), 0 2px 6px rgba(0,0,0,0.03)",
            backdropFilter: "blur(5px) saturate(106%)",
            WebkitBackdropFilter: "blur(5px) saturate(106%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 15,
            paddingRight: 10,
          }}
        >
          <span
            style={{
              fontSize: 16,
              color: composerPlaceholderColor,
              fontFamily: SF_FONT,
              letterSpacing: -0.2,
            }}
          >
            iMessage
          </span>
          <div
            className="flex items-center justify-center"
            style={{ width: 17, height: 17 }}
          >
            <ComposerMicIcon color={composerIconColor} />
          </div>
        </LiquidGlass>
      </div>

      <HomeIndicator dark={!isDark} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main animation controller                                          */
/* ------------------------------------------------------------------ */

export function ChatIMessageAnimation({
  scenario = "reminder" as ChatDemoScenario,
  playing = false,
}: {
  scenario?: ChatDemoScenario;
  playing?: boolean;
}) {
  const allBeats = useMemo(() => buildGlobalBeats(), []);

  const scenarioBeats = useMemo(
    () => allBeats.filter((b) => b.scenario === scenario),
    [allBeats, scenario],
  );

  const [beatIndex, setBeatIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setBeatIndex(0);
    hasStartedRef.current = false;
  }, [scenario]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setBeatIndex(0);
      hasStartedRef.current = false;
      return;
    }

    if (hasStartedRef.current) return;
    if (scenarioBeats.length <= 1) return;

    hasStartedRef.current = true;
    let idx = 0;

    const tick = () => {
      idx++;
      if (idx >= scenarioBeats.length) {
        timerRef.current = null;
        return;
      }
      setBeatIndex(idx);
      timerRef.current = setTimeout(tick, scenarioBeats[idx]?.holdMs ?? 500);
    };

    timerRef.current = setTimeout(tick, scenarioBeats[0]?.holdMs ?? 500);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, scenarioBeats]);

  const beat = scenarioBeats[beatIndex] ?? scenarioBeats[0];

  if (!beat) {
    return (
      <div className="relative w-full h-full" style={{ background: "#000" }} />
    );
  }

  const showLock = beat.lockOpacity > 0;

  return (
    <div className="relative w-full h-full" style={{ background: "#000" }}>
      <style>{HIDE_SCROLLBAR_CSS}</style>
      {showLock ? (
        <div
          className="absolute inset-0"
          style={{ opacity: beat.lockOpacity, pointerEvents: "none" }}
        >
          <LockScreen />
          {beat.showNotification ? (
            <NotificationBanner
              tapped={beat.notificationTapped}
              body={beat.notificationText}
            />
          ) : null}
        </div>
      ) : null}

      <div
        className="absolute inset-0"
        style={{ opacity: beat.chatOpacity, pointerEvents: "none" }}
      >
        <ChatView
          messages={beat.messages}
          isTyping={beat.isTyping}
          readReceiptLabels={beat.readReceiptLabels}
        />
      </div>
    </div>
  );
}
