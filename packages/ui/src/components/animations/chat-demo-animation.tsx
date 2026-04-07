"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useTheme } from "next-themes";
import type { CSSProperties, ReactNode } from "react";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

/* ------------------------------------------------------------------ */
/*  Audio — real MP3 samples for notification & keyboard clicks        */
/* ------------------------------------------------------------------ */

const NOTIFICATION_MP3 = "https://cdn.midday.ai/notification.mp3";
const KEYBOARD_MP3 = "https://cdn.midday.ai/keyboard.mp3";
let audioCtx: AudioContext | null = null;
let notificationBuffer: AudioBuffer | null = null;
let keyboardBuffer: AudioBuffer | null = null;
let rawNotificationData: ArrayBuffer | null = null;
let rawKeyboardData: ArrayBuffer | null = null;
let hasUserInteracted = false;
let isMuted = true;
const muteListeners = new Set<(muted: boolean) => void>();

export function isDemoMuted() {
  return isMuted;
}

export function toggleDemoMute() {
  isMuted = !isMuted;
  for (const fn of muteListeners) fn(isMuted);
  return isMuted;
}

export function onDemoMuteChange(fn: (muted: boolean) => void) {
  muteListeners.add(fn);
  return () => {
    muteListeners.delete(fn);
  };
}

function getOrCreateContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    try {
      audioCtx = new AudioContext();
    } catch {
      return null;
    }
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function decodeBuffers() {
  const ctx = audioCtx;
  if (!ctx) return;
  if (!notificationBuffer && rawNotificationData) {
    const data = rawNotificationData;
    rawNotificationData = null;
    ctx
      .decodeAudioData(data)
      .then((b) => {
        notificationBuffer = b;
      })
      .catch(() => {});
  }
  if (!keyboardBuffer && rawKeyboardData) {
    const data = rawKeyboardData;
    rawKeyboardData = null;
    ctx
      .decodeAudioData(data)
      .then((b) => {
        keyboardBuffer = b;
      })
      .catch(() => {});
  }
}

if (typeof window !== "undefined") {
  fetch(NOTIFICATION_MP3)
    .then((r) => r.arrayBuffer())
    .then((arr) => {
      rawNotificationData = arr;
      decodeBuffers();
    })
    .catch(() => {});
  fetch(KEYBOARD_MP3)
    .then((r) => r.arrayBuffer())
    .then((arr) => {
      rawKeyboardData = arr;
      decodeBuffers();
    })
    .catch(() => {});

  const onInteract = () => {
    hasUserInteracted = true;
    getOrCreateContext();
    decodeBuffers();
    for (const e of [
      "click",
      "touchstart",
      "keydown",
      "scroll",
      "mousedown",
    ] as const)
      document.removeEventListener(e, onInteract, true);
  };
  for (const e of [
    "click",
    "touchstart",
    "keydown",
    "scroll",
    "mousedown",
  ] as const)
    document.addEventListener(e, onInteract, {
      capture: true,
      once: false,
      passive: true,
    });
}

function playNotificationSound() {
  try {
    if (isMuted || !hasUserInteracted || !notificationBuffer) return;
    const ctx = getOrCreateContext();
    if (!ctx || ctx.state !== "running") return;
    const src = ctx.createBufferSource();
    src.buffer = notificationBuffer;
    src.connect(ctx.destination);
    src.start();
  } catch {
    // Audio not available
  }
}

function createKeyboardAudio(): {
  src: AudioBufferSourceNode;
  gain: GainNode;
} | null {
  try {
    if (isMuted || !hasUserInteracted || !keyboardBuffer) return null;
    const ctx = getOrCreateContext();
    if (!ctx || ctx.state !== "running") return null;

    const maxOffset = Math.max(0, keyboardBuffer.duration - 5);
    const offset = Math.random() * maxOffset;

    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = keyboardBuffer;
    gain.gain.setValueAtTime(1, ctx.currentTime);
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime, offset);
    return { src, gain };
  } catch {
    return null;
  }
}

function destroyKeyboardAudio(
  src: AudioBufferSourceNode | null,
  gain: GainNode | null,
) {
  if (!src || !gain) return;
  try {
    gain.gain.cancelScheduledValues(0);
    gain.gain.setValueAtTime(0, 0);
  } catch {}
  try {
    src.stop();
  } catch {}
  try {
    src.disconnect();
  } catch {}
  try {
    gain.disconnect();
  } catch {}
}

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
  setupNotificationTitle?: string;
  setupNotificationBody?: string;
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
  showKeyboard: boolean;
  composerText: string;
  showCamera: boolean;
  cameraFlash: boolean;
  readReceiptLabels: Record<number, string>;
  lockOpacity: number;
  chatOpacity: number;
  showNotification: boolean;
  showSetupNotification: boolean;
  notificationTapped: boolean;
  notificationText: string;
  setupNotificationTitle?: string;
  setupNotificationBody?: string;
};

const SCENARIOS: Record<ChatDemoScenario, ScenarioConfig> = {
  reminder: {
    startOnLockScreen: true,
    notificationText:
      "Invoice #1042 from Acme Corp is 14 days overdue. Total due is $2,400. Want me to send a reminder?",
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
        text: "Done. I sent a reminder to john@acme.com with a payment link. I’ll keep watching for payment.",
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
        text: "Create an invoice for Linear for 40 hours at $150 an hour",
        delayAfterMs: 650,
      },
      {
        sender: "midday",
        text: "I created a draft invoice for Linear. Total is $6,000. Want me to send it now or schedule it?",
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
          imageSrc: "https://cdn.midday.ai/chat-receipt-hemkop.png",
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
        text: "Here are your latest transactions:\n• Stripe payout, +$4,820.00\n• Vercel, $20.00\n• Figma, $15.00\n• OpenAI, $24.00",
        typingMs: 1000,
        delayAfterMs: 1100,
      },
      {
        sender: "user",
        text: "What's the total for software this month?",
        delayAfterMs: 550,
      },
      {
        sender: "midday",
        text: "So far this month, software spend is $59.00.",
        typingMs: 900,
        delayAfterMs: 1000,
      },
    ],
  },
};

const FALLBACK_READ_LABEL = `Read ${formatShortTime(new Date())}`;

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

function formatShortTime(d: Date): string {
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatClockTime(d: Date): string {
  return d
    .toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    .replace(/\s?[APap][Mm]/, "");
}

function formatLockDate(d: Date): string {
  return d.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function useClientNow(): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const sync = () => {
      setNow(new Date());
    };

    sync();

    const schedule = () => {
      const current = new Date();
      const msUntilNextMinute =
        (60 - current.getSeconds()) * 1000 - current.getMilliseconds();

      timeoutId = setTimeout(() => {
        sync();
        intervalId = setInterval(sync, 60_000);
      }, msUntilNextMinute);
    };

    schedule();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  return now;
}

function buildReadReceipts(): Record<ChatDemoScenario, string[]> {
  const now = new Date();
  const fmt = (offsetMin: number) => {
    const d = new Date(now.getTime() - offsetMin * 60_000);
    return `Read ${formatShortTime(d)}`;
  };
  return {
    reminder: [fmt(7)],
    "create-invoice": [fmt(6), fmt(5)],
    "receipt-match": [fmt(4)],
    "latest-transactions": [fmt(1), fmt(0)],
  };
}
const HIDE_SCROLLBAR_CSS = `
  [data-chat-scroll="true"]::-webkit-scrollbar {
    display: none;
  }
  @keyframes cursorBlink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
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
const HOLD_KEYBOARD_UP = 500;
const CHAR_TYPE_MS = 35;
const SUBMIT_PAUSE_MS = 300;
const HOLD_CAMERA_OPEN = 2000;
const HOLD_CAMERA_FLASH = 500;
const HOLD_SETUP_NOTIFICATION = 2200;

function buildGlobalBeats(): DemoBeat[] {
  const beats: DemoBeat[] = [];
  const scenarioCount = SCENARIO_ORDER.length;
  let globalMessageId = 0;
  const readReceiptMap = buildReadReceipts();

  for (let si = 0; si < scenarioCount; si++) {
    const scenarioId = SCENARIO_ORDER[si]!;
    const config = SCENARIOS[scenarioId];
    const scrollBase = si;
    const notificationText =
      config.notificationText ??
      "Invoice #1042 from Acme Corp is 14 days overdue. Total due is $2,400. Want me to send a reminder?";
    const readLabels = readReceiptMap[scenarioId];
    let userMsgCount = 0;

    const localBeats: Array<{
      holdMs: number;
      messages: ChatMessage[];
      isTyping: boolean;
      showKeyboard: boolean;
      composerText: string;
      showCamera: boolean;
      cameraFlash: boolean;
      readReceiptLabels: Record<number, string>;
      lockOpacity: number;
      chatOpacity: number;
      showNotification: boolean;
      showSetupNotification: boolean;
      notificationTapped: boolean;
    }> = [];

    const currentMessages: ChatMessage[] = [];
    const currentReceipts: Record<number, string> = {};

    const snap = (
      holdMs: number,
      overrides?: Partial<{
        isTyping: boolean;
        showKeyboard: boolean;
        composerText: string;
        showCamera: boolean;
        cameraFlash: boolean;
        lockOpacity: number;
        chatOpacity: number;
        showNotification: boolean;
        showSetupNotification: boolean;
        notificationTapped: boolean;
      }>,
    ) => {
      localBeats.push({
        holdMs,
        messages: [...currentMessages],
        isTyping: overrides?.isTyping ?? false,
        showKeyboard: overrides?.showKeyboard ?? false,
        composerText: overrides?.composerText ?? "",
        showCamera: overrides?.showCamera ?? false,
        cameraFlash: overrides?.cameraFlash ?? false,
        readReceiptLabels: { ...currentReceipts },
        lockOpacity: overrides?.lockOpacity ?? 0,
        chatOpacity: overrides?.chatOpacity ?? 1,
        showNotification: overrides?.showNotification ?? false,
        showSetupNotification: overrides?.showSetupNotification ?? false,
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
        if (firstStep.sender === "user") {
          snap(HOLD_CHAT_OPEN, { lockOpacity: 0, chatOpacity: 1 });
          snap(HOLD_KEYBOARD_UP, { showKeyboard: true });
          if (firstStep.text) {
            const typingHoldMs =
              firstStep.text.length * CHAR_TYPE_MS + SUBMIT_PAUSE_MS;
            snap(typingHoldMs, {
              showKeyboard: true,
              composerText: firstStep.text,
            });
          }
          const msgId = globalMessageId++;
          currentMessages.push({
            id: msgId,
            sender: firstStep.sender,
            text: firstStep.text,
            attachment: firstStep.attachment,
          });
          snap(HOLD_USER_MESSAGE);
          const label =
            readLabels[userMsgCount] ??
            readLabels[readLabels.length - 1] ??
            FALLBACK_READ_LABEL;
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        } else {
          const msgId = globalMessageId++;
          currentMessages.push({
            id: msgId,
            sender: firstStep.sender,
            text: firstStep.text,
            attachment: firstStep.attachment,
          });
          snap(HOLD_CHAT_OPEN, { lockOpacity: 0, chatOpacity: 1 });
        }
      } else {
        snap(HOLD_CHAT_OPEN, { lockOpacity: 0, chatOpacity: 1 });
      }

      for (let stepIdx = 1; stepIdx < config.steps.length; stepIdx++) {
        const step = config.steps[stepIdx]!;
        const msgId = globalMessageId++;

        if (step.sender === "user") {
          snap(HOLD_KEYBOARD_UP, { showKeyboard: true });
          if (step.text) {
            const typingHoldMs =
              step.text.length * CHAR_TYPE_MS + SUBMIT_PAUSE_MS;
            snap(typingHoldMs, {
              showKeyboard: true,
              composerText: step.text,
            });
          }
        }

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
            FALLBACK_READ_LABEL;
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        }
      }
    } else {
      snap(HOLD_CHAT_OPEN);

      const firstStep = config.steps[0];
      const isReceiptCamera =
        scenarioId === "receipt-match" &&
        firstStep?.sender === "user" &&
        firstStep?.attachment;

      if (firstStep) {
        if (isReceiptCamera) {
          snap(700, { showKeyboard: true });
          snap(HOLD_CAMERA_OPEN, { showCamera: true, chatOpacity: 0 });
          snap(HOLD_CAMERA_FLASH, {
            showCamera: true,
            cameraFlash: true,
            chatOpacity: 0,
          });
        } else if (firstStep.sender === "user") {
          snap(HOLD_KEYBOARD_UP, { showKeyboard: true });
          if (firstStep.text) {
            const typingHoldMs =
              firstStep.text.length * CHAR_TYPE_MS + SUBMIT_PAUSE_MS;
            snap(typingHoldMs, {
              showKeyboard: true,
              composerText: firstStep.text,
            });
          }
        }

        if (firstStep.sender === "midday" && firstStep.typingMs) {
          snap(HOLD_TYPING, { isTyping: true });
        }

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
            FALLBACK_READ_LABEL;
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        }
      }

      for (let stepIdx = 1; stepIdx < config.steps.length; stepIdx++) {
        const step = config.steps[stepIdx]!;
        const msgId = globalMessageId++;

        if (step.sender === "user") {
          snap(HOLD_KEYBOARD_UP, { showKeyboard: true });
          if (step.text) {
            const typingHoldMs =
              step.text.length * CHAR_TYPE_MS + SUBMIT_PAUSE_MS;
            snap(typingHoldMs, {
              showKeyboard: true,
              composerText: step.text,
            });
          }
        }

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
            FALLBACK_READ_LABEL;
          userMsgCount++;
          currentReceipts[msgId] = label;
          snap(HOLD_READ_RECEIPT);
        }
      }

      if (
        si === scenarioCount - 1 &&
        config.setupNotificationTitle &&
        config.setupNotificationBody
      ) {
        snap(HOLD_SETUP_NOTIFICATION, { showSetupNotification: true });
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
        showKeyboard: local.showKeyboard,
        composerText: local.composerText,
        showCamera: local.showCamera,
        cameraFlash: local.cameraFlash,
        readReceiptLabels: local.readReceiptLabels,
        lockOpacity: local.lockOpacity,
        chatOpacity: local.chatOpacity,
        showNotification: local.showNotification,
        showSetupNotification: local.showSetupNotification,
        notificationTapped: local.notificationTapped,
        notificationText,
        setupNotificationTitle: config.setupNotificationTitle,
        setupNotificationBody: config.setupNotificationBody,
      });
    }
  }

  return beats;
}

/* ------------------------------------------------------------------ */
/*  iOS keyboard (inlined from Keyboard.svg)                            */
/* ------------------------------------------------------------------ */

function IOSKeyboard() {
  return (
    <img
      src="https://cdn.midday.ai/ios-keyboard-dark-v1.svg"
      alt=""
      draggable={false}
      style={{ width: "100%", display: "block" }}
    />
  );
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
      className="flex items-center justify-center z-10"
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

function ComposerSendIcon() {
  return (
    <svg
      width="26"
      height="26"
      viewBox="0 0 26 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle cx="13" cy="13" r="13" fill="#007AFF" />
      <path
        d="M13 18.5V8.5M13 8.5L8.5 12.5M13 8.5L17.5 12.5"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
  const now = useClientNow();
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
        {now ? formatShortTime(now) : "9:41"}
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
/*  Lock screen clock — auto-sized glass digits                        */
/* ------------------------------------------------------------------ */

const CLOCK_MAX_WIDTH = 390;
const LOCK_SCREEN_WALLPAPER = "https://cdn.midday.ai/background-remote-v7.png";

function LockScreenClock({ timeStr }: { timeStr: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgId = useId().replace(/:/g, "");
  const [fontSize, setFontSize] = useState(168);
  const letterSpacing = Math.round(fontSize * -0.042);
  const svgHeight = Math.round(fontSize * 0.9);
  const baselineY = Math.round(svgHeight * 0.8);
  const mainStrokeWidth = Math.max(1.02, fontSize * 0.0058);
  const edgeStrokeWidth = Math.max(0.62, fontSize * 0.0038);
  const hairlineStrokeWidth = Math.max(0.44, fontSize * 0.0026);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = el.firstElementChild as HTMLElement | null;
    if (!measure) return;
    const natural = measure.scrollWidth;
    if (natural > CLOCK_MAX_WIDTH) {
      setFontSize((prev) =>
        Math.max(100, Math.floor(prev * (CLOCK_MAX_WIDTH / natural))),
      );
    } else if (natural < CLOCK_MAX_WIDTH * 0.85 && fontSize < 168) {
      setFontSize((prev) => Math.min(168, prev + 4));
    }
  }, [timeStr, fontSize]);

  const shared: CSSProperties = {
    fontSize,
    fontWeight: 560,
    fontFamily: SF_DISPLAY,
    lineHeight: 0.86,
    letterSpacing,
    textAlign: "center",
    fontFeatureSettings: '"tnum"',
    whiteSpace: "nowrap",
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        marginTop: -4,
        maxWidth: CLOCK_MAX_WIDTH,
        width: "100%",
        alignSelf: "center",
      }}
    >
      <span
        aria-hidden
        style={{
          ...shared,
          display: "block",
          visibility: "hidden",
          pointerEvents: "none",
        }}
      >
        {timeStr}
      </span>

      <svg
        aria-hidden
        width="100%"
        height={svgHeight}
        viewBox={`0 0 ${CLOCK_MAX_WIDTH} ${svgHeight}`}
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          overflow: "visible",
        }}
      >
        <defs>
          <filter
            id={`${svgId}-ambient`}
            x="-20%"
            y="-20%"
            width="140%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="6.5" />
          </filter>

          <pattern
            id={`${svgId}-wallpaper`}
            patternUnits="userSpaceOnUse"
            width={CLOCK_MAX_WIDTH}
            height={svgHeight}
          >
            <image
              href={LOCK_SCREEN_WALLPAPER}
              x="0"
              y="-138"
              width={CLOCK_MAX_WIDTH}
              height="844"
              preserveAspectRatio="xMidYMid slice"
              opacity="0.72"
            />
            <rect
              x="0"
              y="0"
              width={CLOCK_MAX_WIDTH}
              height={svgHeight}
              fill="rgba(255,255,255,0.16)"
            />
          </pattern>

          <linearGradient
            id={`${svgId}-fill`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.96)" />
            <stop offset="48%" stopColor="rgba(242,245,248,0.82)" />
            <stop offset="100%" stopColor="rgba(220,225,231,0.68)" />
          </linearGradient>

          <radialGradient
            id={`${svgId}-body`}
            cx="50%"
            cy="18%"
            r="92%"
            fx="48%"
            fy="14%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="36%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="74%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
          </radialGradient>

          <linearGradient
            id={`${svgId}-outer-border`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.82)" />
            <stop offset="52%" stopColor="rgba(239,242,246,0.46)" />
            <stop offset="100%" stopColor="rgba(190,196,204,0.14)" />
          </linearGradient>

          <linearGradient
            id={`${svgId}-top-hairline`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="12%" stopColor="rgba(255,255,255,0.92)" />
            <stop offset="28%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="56%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient
            id={`${svgId}-inner-top-shadow`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="8%" stopColor="rgba(14,16,20,0.72)" />
            <stop offset="24%" stopColor="rgba(18,20,24,0.42)" />
            <stop offset="48%" stopColor="rgba(18,20,24,0)" />
          </linearGradient>

          <linearGradient
            id={`${svgId}-light-edge`}
            x1="6%"
            y1="0%"
            x2="78%"
            y2="74%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,1)" />
            <stop offset="16%" stopColor="rgba(255,255,255,0.72)" />
            <stop offset="42%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="78%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient
            id={`${svgId}-shadow-edge`}
            x1="86%"
            y1="78%"
            x2="24%"
            y2="16%"
          >
            <stop offset="0%" stopColor="rgba(10,12,16,0.38)" />
            <stop offset="28%" stopColor="rgba(12,14,18,0.16)" />
            <stop offset="58%" stopColor="rgba(12,14,18,0.03)" />
            <stop offset="100%" stopColor="rgba(12,14,18,0)" />
          </linearGradient>

          <linearGradient
            id={`${svgId}-top-sheen`}
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.26)" />
            <stop offset="10%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="24%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>

          <linearGradient
            id={`${svgId}-bottom-rim`}
            x1="0%"
            y1="100%"
            x2="0%"
            y2="0%"
          >
            <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
            <stop offset="12%" stopColor="rgba(255,255,255,0.1)" />
            <stop offset="30%" stopColor="rgba(255,255,255,0.02)" />
          </linearGradient>
        </defs>

        <text
          x="50%"
          y={baselineY + 2}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: "rgba(255,255,255,0.04)",
            filter: `url(#${svgId}-ambient)`,
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: "transparent",
            stroke: `url(#${svgId}-outer-border)`,
            strokeWidth: mainStrokeWidth,
            paintOrder: "stroke fill",
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: `url(#${svgId}-wallpaper)`,
            opacity: 0.54,
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: `url(#${svgId}-fill)`,
            stroke: "rgba(255,255,255,0.04)",
            strokeWidth: Math.max(0.14, mainStrokeWidth * 0.22),
            paintOrder: "stroke fill",
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: `url(#${svgId}-body)`,
            opacity: 0.72,
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: `url(#${svgId}-inner-top-shadow)`,
            opacity: 0.58,
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: `url(#${svgId}-top-sheen)`,
            opacity: 0.18,
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: "transparent",
            stroke: `url(#${svgId}-top-hairline)`,
            strokeWidth: hairlineStrokeWidth,
            paintOrder: "stroke fill",
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: "transparent",
            stroke: `url(#${svgId}-light-edge)`,
            strokeWidth: edgeStrokeWidth,
            paintOrder: "stroke fill",
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: "transparent",
            stroke: `url(#${svgId}-shadow-edge)`,
            strokeWidth: edgeStrokeWidth,
            paintOrder: "stroke fill",
          }}
        >
          {timeStr}
        </text>

        <text
          x="50%"
          y={baselineY}
          textAnchor="middle"
          style={{
            ...shared,
            letterSpacing: `${letterSpacing}px`,
            fill: `url(#${svgId}-bottom-rim)`,
            opacity: 0.22,
          }}
        >
          {timeStr}
        </text>
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Weather data — browser geolocation + Open-Meteo (free, no key)     */
/* ------------------------------------------------------------------ */

type WeatherData = {
  temp: number;
  high: number;
  low: number;
  code: number;
  city: string;
  sunset?: string;
  unit?: "celsius" | "fahrenheit";
};

function getBrowserTemperatureUnit(): "celsius" | "fahrenheit" {
  if (typeof navigator === "undefined") return "celsius";

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of languages) {
    const region = language.split("-")[1]?.toUpperCase();
    if (
      region &&
      ["US", "BS", "BZ", "KY", "PW", "LR", "FM", "MH"].includes(region)
    ) {
      return "fahrenheit";
    }
  }

  return "celsius";
}

function useWeather(): WeatherData | null {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;
    const unit = getBrowserTemperatureUnit();

    (async () => {
      try {
        const res = await fetch(`/api/geo?unit=${unit}`);
        if (cancelled || !res.ok) return;
        const json = await res.json();
        if (cancelled) return;

        setData({
          temp: json.temp,
          high: json.high,
          low: json.low,
          code: json.code,
          city: json.city ?? "My Location",
          sunset: json.sunset,
          unit: json.unit ?? unit,
        });
      } catch {
        // Silently fail — widgets just won't show
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return data;
}

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear Sky",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Icy Fog",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  80: "Light Showers",
  81: "Showers",
  82: "Heavy Showers",
  95: "Thunderstorm",
};

function weatherLabel(code: number): string {
  return (
    WEATHER_LABELS[code] ??
    WEATHER_LABELS[Math.floor(code / 10) * 10] ??
    "Partly Cloudy"
  );
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  angleInDegrees: number,
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180;

  return {
    x: cx + radius * Math.cos(angleInRadians),
    y: cy + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number,
) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    "M",
    start.x,
    start.y,
    "A",
    radius,
    radius,
    0,
    largeArcFlag,
    0,
    end.x,
    end.y,
  ].join(" ");
}

function LockWeatherIcon({ code }: { code: number }) {
  const isClear = code <= 1;
  const isCloudy = code >= 2 && code <= 3;
  const isRain = (code >= 51 && code <= 65) || (code >= 80 && code <= 82);
  const isSnow = code >= 71 && code <= 75;

  if (isClear) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="3.7" fill="#999999" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <line
            key={deg}
            x1="10"
            y1="1.9"
            x2="10"
            y2="3.8"
            stroke="#999999"
            strokeWidth="1.2"
            strokeLinecap="round"
            transform={`rotate(${deg} 10 10)`}
          />
        ))}
      </svg>
    );
  }

  if (isSnow) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M4.6 12.8a3.6 3.6 0 0 1-.2-7.2 4.9 4.9 0 0 1 9.4 0 2.9 2.9 0 0 1-.2 7.2H4.6Z"
          fill="#999999"
        />
        <circle cx="7" cy="15.6" r="0.7" fill="#999999" />
        <circle cx="10" cy="16.2" r="0.7" fill="#999999" />
        <circle cx="13" cy="15.4" r="0.7" fill="#999999" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="12" cy="6.5" r="2.6" fill="#999999" />
      <path
        d="M4.2 13.3a3.6 3.6 0 0 1-.2-7.2 4.9 4.9 0 0 1 9.4 0 2.9 2.9 0 0 1-.2 7.2H4.2Z"
        fill="#999999"
      />
      {(isCloudy || isRain) &&
        [0, 60, 120, 180, 240, 300].map((deg) => (
          <line
            key={deg}
            x1="12"
            y1="2.1"
            x2="12"
            y2="3.3"
            stroke="#999999"
            strokeWidth="1"
            strokeLinecap="round"
            transform={`rotate(${deg} 12 6.5)`}
          />
        ))}
      {isRain && (
        <>
          <line
            x1="7"
            y1="15"
            x2="6.3"
            y2="16.8"
            stroke="#999999"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <line
            x1="10"
            y1="15"
            x2="9.3"
            y2="16.8"
            stroke="#999999"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <line
            x1="13"
            y1="15"
            x2="12.3"
            y2="16.8"
            stroke="#999999"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  );
}

function LockScreenWidgets({ weather }: { weather: WeatherData | null }) {
  if (!weather) return null;

  const condition = weatherLabel(weather.code);
  const gaugeMin = weather.low;
  const gaugeMax = Math.max(weather.high, gaugeMin + 1);
  const progress = Math.max(
    0,
    Math.min(1, (weather.temp - gaugeMin) / (gaugeMax - gaugeMin)),
  );
  const startAngle = 238;
  const endAngle = 482;
  const valueAngle = startAngle + (endAngle - startAngle) * progress;
  const dot = polarToCartesian(246, 39, 26, valueAngle);
  const sunsetParts = weather.sunset?.split(" ");
  const sunsetTime = sunsetParts?.[0] ?? "8:29";
  const sunsetMeridiem = sunsetParts?.[1] ?? "PM";
  const widgetTextStyle = {
    textRendering: "geometricPrecision" as const,
    fontKerning: "normal" as const,
  };

  return (
    <motion.div
      style={{
        width: "100%",
        marginTop: 18,
        padding: "0",
        zIndex: 10,
        boxSizing: "border-box",
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: "easeOut", delay: 0.08 }}
    >
      <svg
        viewBox="0 0 402 72"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        <g
          transform="translate(-30 -1.5) scale(1.08)"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <foreignObject x="34" y="4" width="22" height="22">
            <div
              style={{
                width: "100%",
                height: "100%",
                backdropFilter: "blur(68px)",
                WebkitBackdropFilter: "blur(68px)",
              }}
            />
          </foreignObject>
          <g transform="translate(37.5 7)">
            <LockWeatherIcon code={weather.code} />
          </g>
          <text
            x="60"
            y="22"
            fill="#999999"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_FONT,
              fontSize: 14.5,
              fontWeight: 500,
              letterSpacing: "0px",
            }}
          >
            {weather.temp}°
          </text>
        </g>

        <g
          transform="translate(-30 -1.5) scale(1.08)"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <text
            x="38"
            y="42.5"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_DISPLAY,
              fontSize: 16.5,
              fontWeight: 400,
              letterSpacing: "-0.18px",
            }}
          >
            {condition}
          </text>
          <text
            x="38"
            y="62.5"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_FONT,
              fontSize: 14,
              fontWeight: 400,
              letterSpacing: "-0.04px",
            }}
          >
            H:{weather.high}° L:{weather.low}°
          </text>
        </g>

        <g
          transform="translate(-24 -2) scale(1.1)"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <path
            d={describeArc(246, 39, 26, startAngle, endAngle)}
            fill="none"
            stroke="#333333"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d={describeArc(246, 39, 26, startAngle, valueAngle)}
            fill="none"
            stroke="white"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx={dot.x} cy={dot.y} r="3.6" fill="white" />
          <text
            x="246"
            y="45"
            textAnchor="middle"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_DISPLAY,
              fontSize: 25.5,
              fontWeight: 500,
              letterSpacing: "-0.45px",
            }}
          >
            {weather.temp}
          </text>
          <text
            x="241"
            y="66"
            textAnchor="end"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_FONT,
              fontSize: 10.5,
              fontWeight: 400,
              letterSpacing: "0px",
            }}
          >
            {weather.low}
          </text>
          <text
            x="251"
            y="66"
            textAnchor="start"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_FONT,
              fontSize: 10.5,
              fontWeight: 400,
              letterSpacing: "0px",
            }}
          >
            {weather.high}
          </text>
        </g>

        <g
          transform="translate(-1 -4) scale(1.1)"
          style={{ mixBlendMode: "plus-lighter" }}
        >
          <circle cx="334" cy="36" r="29.5" fill="#333333" />
          <path
            d="M336.911 24.0977C336.911 24.2731 336.893 24.4432 336.857 24.6079C336.825 24.7726 336.779 24.9302 336.718 25.0806H331.277C331.216 24.9302 331.168 24.7726 331.132 24.6079C331.1 24.4432 331.083 24.2731 331.083 24.0977C331.083 23.6966 331.159 23.3206 331.309 22.9697C331.463 22.6188 331.673 22.3091 331.938 22.0405C332.206 21.772 332.516 21.5625 332.867 21.4121C333.221 21.2581 333.599 21.1812 334 21.1812C334.397 21.1812 334.772 21.2581 335.123 21.4121C335.477 21.5625 335.787 21.772 336.052 22.0405C336.32 22.3091 336.53 22.6188 336.68 22.9697C336.834 23.3206 336.911 23.6966 336.911 24.0977ZM328.317 24.377C328.171 24.377 328.047 24.3304 327.947 24.2373C327.85 24.1442 327.802 24.0314 327.802 23.8989C327.802 23.77 327.85 23.659 327.947 23.5659C328.043 23.4728 328.167 23.4263 328.317 23.4263H329.558C329.708 23.4263 329.832 23.4728 329.929 23.5659C330.025 23.659 330.076 23.77 330.079 23.8989C330.079 24.0314 330.029 24.1442 329.929 24.2373C329.832 24.3304 329.708 24.377 329.558 24.377H328.317ZM330.52 21.3047L329.639 20.4292C329.535 20.3218 329.481 20.2 329.478 20.064C329.478 19.9279 329.524 19.8151 329.617 19.7256C329.71 19.6361 329.823 19.5913 329.956 19.5913C330.092 19.5913 330.212 19.645 330.315 19.7524L331.196 20.6279C331.304 20.7318 331.357 20.8517 331.357 20.9878C331.361 21.1239 331.316 21.2384 331.223 21.3315C331.134 21.4282 331.019 21.4748 330.879 21.4712C330.743 21.464 330.623 21.4085 330.52 21.3047ZM336.771 21.3315C336.678 21.242 336.632 21.1292 336.632 20.9932C336.635 20.8535 336.691 20.7318 336.798 20.6279L337.679 19.7524C337.783 19.645 337.903 19.5913 338.039 19.5913C338.175 19.5877 338.288 19.6325 338.377 19.7256C338.471 19.8187 338.515 19.9333 338.512 20.0693C338.512 20.2018 338.46 20.3218 338.356 20.4292L337.475 21.3047C337.371 21.4085 337.251 21.4622 337.115 21.4658C336.979 21.4694 336.865 21.4246 336.771 21.3315ZM338.437 24.377C338.293 24.377 338.172 24.3304 338.071 24.2373C337.971 24.1442 337.919 24.0314 337.916 23.8989C337.916 23.77 337.966 23.659 338.066 23.5659C338.166 23.4728 338.29 23.4263 338.437 23.4263H339.677C339.828 23.4263 339.951 23.4728 340.048 23.5659C340.145 23.659 340.193 23.77 340.193 23.8989C340.193 24.0314 340.145 24.1442 340.048 24.2373C339.951 24.3304 339.828 24.377 339.677 24.377H338.437Z"
            fill="white"
          />
          <text
            x="334"
            y="43"
            textAnchor="middle"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_DISPLAY,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: "-0.12px",
            }}
          >
            {sunsetTime}
          </text>
          <text
            x="334"
            y="57.5"
            textAnchor="middle"
            fill="white"
            style={{
              ...widgetTextStyle,
              fontFamily: SF_FONT,
              fontSize: 8.5,
              fontWeight: 400,
              letterSpacing: "0px",
            }}
          >
            {sunsetMeridiem}
          </text>
        </g>
      </svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Lock screen — iOS 26 Liquid Glass                                  */
/* ------------------------------------------------------------------ */

function LockScreen() {
  const now = useClientNow();
  const timeStr = now ? formatClockTime(now) : "09:41";
  const dateStr = now ? formatLockDate(now) : "Sunday, April 5";
  const weather = useWeather();

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Image
        src={LOCK_SCREEN_WALLPAPER}
        alt=""
        fill
        priority
        sizes="390px"
        className="absolute inset-0 object-cover"
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
            marginBottom: 10,
            textShadow: "0 1px 10px rgba(255,255,255,0.08)",
          }}
        >
          {dateStr}
        </div>

        <LockScreenClock timeStr={timeStr} />

        <LockScreenWidgets weather={weather} />
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

function SetupNotificationBanner({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <motion.a
      href="https://app.midday.ai"
      target="_blank"
      rel="noreferrer"
      initial={{ y: -88, opacity: 0, scale: 0.96, filter: "blur(10px)" }}
      animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
      whileHover={{ scale: 1.018, y: -1 }}
      whileTap={{ scale: 0.992 }}
      transition={{ type: "spring", damping: 26, stiffness: 250, mass: 0.95 }}
      className="absolute"
      style={{
        top: 57,
        left: 12,
        right: 12,
        zIndex: 40,
        pointerEvents: "auto",
        textDecoration: "none",
      }}
    >
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: -36, scale: 0.98 }}
        animate={{ opacity: 0.18, y: 10, scale: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 210 }}
        className="absolute left-0 right-0"
        style={{
          height: 72,
          borderRadius: 24,
          background:
            "linear-gradient(180deg, rgba(58,58,64,0.34), rgba(24,24,28,0.26))",
          backdropFilter: "blur(34px) saturate(125%)",
          WebkitBackdropFilter: "blur(34px) saturate(125%)",
          border: "0.7px solid rgba(255,255,255,0.07)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 40px rgba(0,0,0,0.18)",
        }}
      />
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, y: -24, scale: 0.97 }}
        animate={{ opacity: 0.12, y: 18, scale: 1 }}
        transition={{ type: "spring", damping: 28, stiffness: 210 }}
        className="absolute left-4 right-4"
        style={{
          height: 72,
          borderRadius: 24,
          background:
            "linear-gradient(180deg, rgba(52,52,58,0.3), rgba(20,20,24,0.22))",
          backdropFilter: "blur(32px) saturate(122%)",
          WebkitBackdropFilter: "blur(32px) saturate(122%)",
          border: "0.7px solid rgba(255,255,255,0.06)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 34px rgba(0,0,0,0.14)",
        }}
      />

      <div
        className="relative flex items-start gap-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(42,42,46,0.78), rgba(18,18,20,0.7))",
          backdropFilter: "blur(40px) saturate(118%)",
          WebkitBackdropFilter: "blur(40px) saturate(118%)",
          borderRadius: 24,
          padding: "12px 14px",
          border: "0.7px solid rgba(255, 255, 255, 0.08)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.1), 0 10px 34px rgba(0,0,0,0.22)",
        }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 24,
            background:
              "linear-gradient(180deg, rgba(34,34,38,0.5), rgba(12,12,14,0.66))",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: 24,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012) 34%, rgba(255,255,255,0) 56%), radial-gradient(140% 70% at 50% 0%, rgba(255,255,255,0.04), rgba(255,255,255,0) 60%)",
            mixBlendMode: "screen",
          }}
        />

        <div className="relative">
          <MiddayLogo size={38} borderRadius={9} />
        </div>

        <div className="relative flex-1 min-w-0">
          <p
            className="mt-0.5"
            style={{
              fontSize: 13.5,
              lineHeight: 1.25,
              fontWeight: 600,
              color: "rgba(255,255,255,0.96)",
              fontFamily: SF_FONT,
            }}
          >
            {title}
          </p>
          <p
            className="mt-0.5"
            style={{
              fontSize: 13,
              lineHeight: 1.3,
              color: "rgba(255,255,255,0.78)",
              fontFamily: SF_FONT,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {body}
          </p>
        </div>
      </div>
    </motion.a>
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
        {attachment.imageSrc ? (
          <Image
            src={attachment.imageSrc}
            alt={attachment.subtitle}
            width={1080}
            height={1440}
            sizes="(max-width: 768px) 100vw, 320px"
            style={{
              display: "block",
              width: "100%",
              height: "auto",
            }}
          />
        ) : null}
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
            <Image
              src={getWebsiteLogo(attachment.website)}
              alt={attachment.customer}
              width={15}
              height={15}
              sizes="15px"
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
/*  iOS Camera viewfinder                                              */
/* ------------------------------------------------------------------ */

const RECEIPT_IMAGE_SRC = "https://cdn.midday.ai/reciept.jpg";

const CAMERA_DRIFT_CSS = `
@keyframes cameraDriftX {
  0%   { transform: translateX(0px); }
  13%  { transform: translateX(-1.8px); }
  27%  { transform: translateX(0.6px); }
  45%  { transform: translateX(-0.9px); }
  62%  { transform: translateX(1.4px); }
  78%  { transform: translateX(-0.4px); }
  100% { transform: translateX(0px); }
}
@keyframes cameraDriftY {
  0%   { transform: translateY(0px); }
  17%  { transform: translateY(1.2px); }
  35%  { transform: translateY(-0.7px); }
  52%  { transform: translateY(1.6px); }
  70%  { transform: translateY(-1.1px); }
  85%  { transform: translateY(0.5px); }
  100% { transform: translateY(0px); }
}
@keyframes cameraDriftRotate {
  0%   { transform: rotate(0deg); }
  25%  { transform: rotate(-0.3deg); }
  50%  { transform: rotate(0.2deg); }
  75%  { transform: rotate(-0.15deg); }
  100% { transform: rotate(0deg); }
}
`;

function IOSCameraView({ flash }: { flash: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#000",
        overflow: "hidden",
      }}
    >
      <style>{CAMERA_DRIFT_CSS}</style>
      {/* Viewfinder background — three nested layers for organic handheld drift */}
      <div
        style={{
          position: "absolute",
          inset: -10,
          animation: "cameraDriftX 2.8s ease-in-out infinite",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            animation: "cameraDriftY 3.3s ease-in-out infinite",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              backgroundImage: `url(${RECEIPT_IMAGE_SRC})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(0.85)",
              transform: "scale(1.05)",
              animation: "cameraDriftRotate 4s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar dark={false} />

      {/* Top bar — flash & flip icons */}
      <div
        style={{
          position: "absolute",
          top: 54,
          left: 0,
          right: 0,
          height: 44,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 10,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M13 3L10.72 5.28C10.38 5.62 10.54 6.18 11.01 6.3L11.53 6.44C8.98 7.18 7 9.42 7 12.16V13H9V12.16C9 10.08 10.68 8.18 13 7.84V9.5C13 9.89 13.47 10.08 13.74 9.81L17.15 6.39C17.34 6.21 17.34 5.9 17.15 5.72L13.74 2.3C13.47 2.03 13 2.22 13 2.61V3Z"
            fill="rgba(255,255,255,0.85)"
          />
          <path
            d="M17 12V12.84C17 14.92 15.32 16.82 13 17.16V15.5C13 15.11 12.53 14.92 12.26 15.19L8.85 18.61C8.66 18.79 8.66 19.1 8.85 19.28L12.26 22.7C12.53 22.97 13 22.78 13 22.39V21C15.02 20.72 16.62 19.53 17.28 17.72L17.47 17.56C17.53 17.5 18 17.18 18 16.84V12H17Z"
            fill="rgba(255,255,255,0.85)"
          />
        </svg>
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7 2V13H10V16H13V13H21L17 8L21 3H13V2H7ZM9 4H11V5H17.5L15 8L17.5 11H11V10H9V4Z"
            fill="rgba(255,255,255,0.85)"
          />
        </svg>
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 140,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.7) 60%, transparent)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          paddingTop: 12,
          zIndex: 10,
        }}
      >
        {/* Mode labels */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 16,
            fontFamily: SF_FONT,
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Video</span>
          <span style={{ color: "#FFD60A", fontWeight: 600 }}>Photo</span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>Portrait</span>
        </div>

        {/* Shutter row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            paddingLeft: 40,
            paddingRight: 40,
          }}
        >
          {/* Thumbnail placeholder */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: "2px solid rgba(255,255,255,0.4)",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${RECEIPT_IMAGE_SRC})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          </div>

          {/* Shutter button */}
          <div
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: "4px solid rgba(255,255,255,0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.95)",
                }}
              />
            </div>
          </div>

          {/* Flip camera icon */}
          <div style={{ width: 38, height: 38, flexShrink: 0 }}>
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ margin: "3px" }}
            >
              <path
                d="M20 5H16.83L15 3H9L7.17 5H4C2.9 5 2 5.9 2 7V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V7C22 5.9 21.1 5 20 5ZM12 18C9.24 18 7 15.76 7 13C7 10.24 9.24 8 12 8C14.76 8 17 10.24 17 13C17 15.76 14.76 18 12 18Z"
                fill="rgba(255,255,255,0.85)"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="camera-flash"
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "#fff",
              zIndex: 50,
              pointerEvents: "none",
            }}
          />
        )}
      </AnimatePresence>

      {/* Home indicator */}
      <HomeIndicator />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat view — iOS 26 Liquid Glass iMessage                           */
/* ------------------------------------------------------------------ */

function ChatView({
  messages,
  isTyping,
  showKeyboard,
  composerText,
  readReceiptLabels,
  onBackTap,
  onInputTap,
  animateKeyboardDock,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
  showKeyboard: boolean;
  composerText: string;
  readReceiptLabels: Record<number, string>;
  onBackTap?: () => void;
  onInputTap?: () => void;
  animateKeyboardDock: boolean;
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
  const keyboardHeight = 342;
  const keyboardHiddenOffset = 4;
  const composerInset = 114;
  const visibleBottomInset = showKeyboard ? keyboardHeight + 52 : composerInset;

  const [typedLength, setTypedLength] = useState(0);
  const composerTextRef = useRef(composerText);
  const kbSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const kbGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (composerText !== composerTextRef.current) {
      composerTextRef.current = composerText;
      setTypedLength(0);
    }
    if (!composerText) return;
    if (typedLength >= composerText.length) return;
    const timer = setTimeout(() => {
      setTypedLength((prev) => prev + 1);
    }, CHAR_TYPE_MS);
    return () => clearTimeout(timer);
  }, [composerText, typedLength]);

  useEffect(() => {
    const isVisible = scrollRef.current?.offsetParent !== null;
    if (showKeyboard && composerText && isVisible) {
      if (!kbSrcRef.current) {
        const audio = createKeyboardAudio();
        if (audio) {
          kbSrcRef.current = audio.src;
          kbGainRef.current = audio.gain;
          audio.src.onended = () => {
            kbSrcRef.current = null;
            kbGainRef.current = null;
          };
        }
      }
    } else {
      destroyKeyboardAudio(kbSrcRef.current, kbGainRef.current);
      kbSrcRef.current = null;
      kbGainRef.current = null;
    }
    return () => {
      destroyKeyboardAudio(kbSrcRef.current, kbGainRef.current);
      kbSrcRef.current = null;
      kbGainRef.current = null;
    };
  }, [showKeyboard, composerText]);

  useEffect(() => {
    return onDemoMuteChange((muted) => {
      if (muted) {
        destroyKeyboardAudio(kbSrcRef.current, kbGainRef.current);
        kbSrcRef.current = null;
        kbGainRef.current = null;
      }
    });
  }, []);

  const visibleComposerText = composerText
    ? composerText.slice(0, typedLength)
    : "";
  const showSendButton = composerText.length > 0 && typedLength > 0;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping, showKeyboard]);

  return (
    <div
      className="absolute inset-0 flex flex-col"
      style={{
        background: isDark ? "#000000" : "#FFFFFF",
        color: isDark ? "#FFFFFF" : "#000000",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <StatusBar dark={!isDark} />

      {/* Header matching iOS screenshot */}
      <div
        className="relative"
        style={{
          marginTop: 52,
          padding: "6px 14px 12px",
          background: headerBackground,
        }}
      >
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBackTap}
            className="flex items-center justify-center"
            style={{
              width: 36,
              height: 36,
              position: "relative",
              zIndex: 30,
              pointerEvents: "auto",
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: onBackTap ? "pointer" : "default",
            }}
          >
            <LiquidGlass
              borderRadius="50%"
              className="flex items-center justify-center"
              style={{ width: 36, height: 36 }}
            >
              <HeaderBackIcon color={controlIconColor} />
            </LiquidGlass>
          </button>

          <a
            href="https://cal.com/pontus-midday/15min"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center"
            style={{
              width: 36,
              minWidth: 36,
              position: "relative",
              zIndex: 30,
              pointerEvents: "auto",
            }}
          >
            <LiquidGlass
              borderRadius="50%"
              className="flex items-center justify-center"
              style={{ width: 36, height: 36 }}
            >
              <HeaderVideoIcon color={controlIconColor} />
            </LiquidGlass>
          </a>
        </div>

        <div className="flex flex-col items-center" style={{ marginTop: -30 }}>
          <a
            href="https://x.com/middayai"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              position: "relative",
              zIndex: 30,
              pointerEvents: "auto",
              display: "inline-flex",
            }}
          >
            <ContactAvatar size={56} />
          </a>

          <LiquidGlass
            borderRadius={16}
            style={{
              marginTop: -4,
              minHeight: 30,
              padding: "0 12px",
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
      <motion.div
        layout
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        data-chat-scroll="true"
        animate={{
          paddingTop: 6,
          paddingBottom: visibleBottomInset,
        }}
        transition={{
          ...(animateKeyboardDock
            ? {
                type: "spring" as const,
                stiffness: 380,
                damping: 34,
                mass: 0.92,
              }
            : {
                duration: 0,
              }),
        }}
        style={{
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
      </motion.div>

      <motion.div
        className="absolute left-0 right-0 bottom-0"
        animate={{
          y: showKeyboard ? 0 : keyboardHeight + keyboardHiddenOffset,
        }}
        transition={{
          ...(animateKeyboardDock
            ? {
                type: "spring" as const,
                stiffness: 390,
                damping: 34,
                mass: 0.92,
              }
            : {
                duration: 0,
              }),
        }}
        style={{
          zIndex: 20,
          willChange: "transform",
        }}
      >
        <div
          className="flex items-center gap-[8px]"
          style={{
            width: "calc(100% - 20px)",
            margin: "0 auto",
            padding: "12px 16px 22px",
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
          <button
            type="button"
            onClick={onInputTap}
            className="flex-1"
            style={{
              display: "block",
              flex: 1,
              minWidth: 0,
              pointerEvents: "auto",
              background: "transparent",
              border: "none",
              padding: 0,
              textAlign: "left",
              cursor: "text",
            }}
          >
            <LiquidGlass
              borderRadius={18}
              className="flex-1"
              style={{
                width: "100%",
                height: 36,
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.008))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -1px 0 rgba(255,255,255,0.008), 0 2px 6px rgba(0,0,0,0.03)",
                backdropFilter: "blur(5px) saturate(106%)",
                WebkitBackdropFilter: "blur(5px) saturate(106%)",
                display: "flex",
                alignItems: "center",
                gap: 8,
                paddingLeft: 15,
                paddingRight: 10,
                minWidth: 0,
              }}
            >
              {visibleComposerText ? (
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: "block",
                    fontSize: 16,
                    color: isDark ? "#FFFFFF" : "#000000",
                    fontFamily: SF_FONT,
                    letterSpacing: -0.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    direction: "rtl",
                    textAlign: "left",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "flex-end",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      direction: "ltr",
                    }}
                  >
                    {visibleComposerText}
                    <span
                      style={{
                        display: "inline-block",
                        width: 2,
                        height: 18,
                        marginLeft: 1,
                        background: "#007AFF",
                        verticalAlign: "text-bottom",
                        animation: "cursorBlink 1s step-end infinite",
                        flexShrink: 0,
                      }}
                    />
                  </span>
                </span>
              ) : (
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 16,
                    color: composerPlaceholderColor,
                    fontFamily: SF_FONT,
                    letterSpacing: -0.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  iMessage
                </span>
              )}
              <div
                className="flex items-center justify-center"
                style={{
                  width: showSendButton ? 26 : 17,
                  height: showSendButton ? 26 : 17,
                  transition: "all 0.15s ease",
                  flexShrink: 0,
                }}
              >
                {showSendButton ? (
                  <ComposerSendIcon />
                ) : (
                  <ComposerMicIcon color={composerIconColor} />
                )}
              </div>
            </LiquidGlass>
          </button>
        </div>

        <IOSKeyboard />
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main animation controller                                          */
/* ------------------------------------------------------------------ */

export function ChatIMessageAnimation({
  scenario = "reminder" as ChatDemoScenario,
  playing = false,
  skipLockScreen = false,
  startAtEnd = false,
  onComplete,
  onBackTap,
}: {
  scenario?: ChatDemoScenario;
  playing?: boolean;
  skipLockScreen?: boolean;
  startAtEnd?: boolean;
  onComplete?: () => void;
  onBackTap?: () => void;
}) {
  const allBeats = useMemo(() => buildGlobalBeats(), []);

  const scenarioBeats = useMemo(() => {
    const beats = allBeats.filter((b) => b.scenario === scenario);
    if (!skipLockScreen) return beats;
    const firstChatIdx = beats.findIndex((b) => b.chatOpacity > 0);
    return firstChatIdx > 0 ? beats.slice(firstChatIdx) : beats;
  }, [allBeats, scenario, skipLockScreen]);

  const containerRef = useRef<HTMLDivElement>(null);
  const [beatIndex, setBeatIndex] = useState(0);
  const [manualKeyboardOpen, setManualKeyboardOpen] = useState(false);
  const [shouldAnimateKeyboardDock, setShouldAnimateKeyboardDock] =
    useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasCompletedRef = useRef(false);
  const prevNotificationRef = useRef(false);

  useEffect(() => {
    let frameId: number | null = null;

    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setShouldAnimateKeyboardDock(false);
    setBeatIndex(startAtEnd ? Math.max(scenarioBeats.length - 1, 0) : 0);
    setManualKeyboardOpen(false);
    hasCompletedRef.current = startAtEnd;
    prevNotificationRef.current = false;

    frameId = window.requestAnimationFrame(() => {
      setShouldAnimateKeyboardDock(true);
    });

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, [scenario, startAtEnd, scenarioBeats.length]);

  useEffect(() => {
    if (!playing) {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      setBeatIndex(0);
      setManualKeyboardOpen(false);
      hasCompletedRef.current = false;
      prevNotificationRef.current = false;
      return;
    }

    if (scenarioBeats.length <= 1) return;

    const isLastBeat = beatIndex >= scenarioBeats.length - 1;
    if (isLastBeat) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onComplete?.();
      }
      return;
    }

    hasCompletedRef.current = false;
    timerRef.current = setTimeout(() => {
      setBeatIndex((prev) => Math.min(prev + 1, scenarioBeats.length - 1));
    }, scenarioBeats[beatIndex]?.holdMs ?? 500);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [playing, scenarioBeats, beatIndex, onComplete]);

  const clampedIndex = Math.min(beatIndex, scenarioBeats.length - 1);
  const beat = scenarioBeats[clampedIndex] ?? scenarioBeats[0];
  const effectiveShowKeyboard =
    (beat?.showKeyboard ?? false) || manualKeyboardOpen;
  const hasLockScreenStart = (scenarioBeats[0]?.lockOpacity ?? 0) > 0;
  const isShowingLockScreen = (beat?.lockOpacity ?? 0) > 0;

  const handleBackStep = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    hasCompletedRef.current = false;

    if (manualKeyboardOpen && !(beat?.showKeyboard ?? false)) {
      setManualKeyboardOpen(false);
      return;
    }

    if (hasLockScreenStart && !isShowingLockScreen) {
      setBeatIndex(0);
      setManualKeyboardOpen(false);
      return;
    }

    onBackTap?.();
  }, [
    manualKeyboardOpen,
    beat?.showKeyboard,
    hasLockScreenStart,
    isShowingLockScreen,
    onBackTap,
  ]);

  useEffect(() => {
    const showing =
      (beat?.showNotification ?? false) ||
      (beat?.showSetupNotification ?? false);
    const isVisible = containerRef.current?.offsetParent !== null;
    if (showing && !prevNotificationRef.current && playing && isVisible) {
      playNotificationSound();
    }
    prevNotificationRef.current = showing;
  }, [beat?.showNotification, beat?.showSetupNotification, playing]);

  if (!beat) {
    return (
      <div className="relative w-full h-full" style={{ background: "#000" }} />
    );
  }

  const showLock = beat.lockOpacity > 0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full"
      style={{ background: "#000" }}
    >
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

      {beat.showCamera && (
        <div
          className="absolute inset-0"
          style={{ zIndex: 30, pointerEvents: "none" }}
        >
          <IOSCameraView flash={beat.cameraFlash} />
        </div>
      )}

      {beat.showSetupNotification &&
      beat.setupNotificationTitle &&
      beat.setupNotificationBody ? (
        <div
          className="absolute inset-0"
          style={{ zIndex: 40, pointerEvents: "none" }}
        >
          <SetupNotificationBanner
            title={beat.setupNotificationTitle}
            body={beat.setupNotificationBody}
          />
        </div>
      ) : null}

      <div
        className="absolute inset-0"
        style={{ opacity: beat.chatOpacity, pointerEvents: "auto" }}
      >
        <ChatView
          messages={beat.messages}
          isTyping={beat.isTyping}
          showKeyboard={effectiveShowKeyboard}
          composerText={beat.composerText}
          readReceiptLabels={beat.readReceiptLabels}
          onBackTap={handleBackStep}
          onInputTap={() => setManualKeyboardOpen(true)}
          animateKeyboardDock={shouldAnimateKeyboardDock}
        />
      </div>
    </div>
  );
}
