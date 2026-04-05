"use client";

import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: number;
  sender: "user" | "midday";
  text: string;
};

const CONVERSATION: Array<{
  sender: "user" | "midday";
  text: string;
  typingMs?: number;
  delayAfterMs?: number;
}> = [
  {
    sender: "midday",
    text: "Invoice #1042 from Acme Corp ($2,400) is 14 days overdue. Want me to send a reminder?",
    typingMs: 1200,
    delayAfterMs: 800,
  },
  {
    sender: "user",
    text: "Yes, send a reminder",
    delayAfterMs: 600,
  },
  {
    sender: "midday",
    text: "Done \u2014 reminder sent to john@acme.com. They\u2019ll get a payment link too.",
    typingMs: 1000,
    delayAfterMs: 1400,
  },
  {
    sender: "user",
    text: "Log 8h for Project Aurora today",
    delayAfterMs: 600,
  },
  {
    sender: "midday",
    text: "Logged 8h for Project Aurora (Apr 5). Your total this week is 32h.",
    typingMs: 1000,
    delayAfterMs: 1400,
  },
  {
    sender: "user",
    text: "Create an invoice for Linear \u2014 40h at $150/h",
    delayAfterMs: 600,
  },
  {
    sender: "midday",
    text: "Invoice #1043 created \u2014 $6,000 for Linear (40h \u00d7 $150). Ready to send whenever you are.",
    typingMs: 1200,
  },
];

const MIDDAY_LOGO_PATH =
  "M21.22 4.763a13.07 13.07 0 0 1 0 8.265l-.774 2.318 2.873-2.546a10.54 10.54 0 0 0 3.333-5.771l.815-3.982 2.477.507-.815 3.982a13.07 13.07 0 0 1-4.132 7.157l-1.832 1.624 3.763-.77a10.541 10.541 0 0 0 5.773-3.332l2.696-3.04 1.892 1.677-2.696 3.04a13.07 13.07 0 0 1-7.158 4.132l-2.4.49 3.645 1.216a10.54 10.54 0 0 0 6.666 0l3.855-1.285.799 2.398-3.855 1.285a13.069 13.069 0 0 1-8.264 0l-2.32-.774 2.547 2.874a10.537 10.537 0 0 0 5.772 3.33l3.98.817-.506 2.477-3.981-.815a13.069 13.069 0 0 1-7.158-4.132l-1.622-1.83.77 3.761a10.537 10.537 0 0 0 3.33 5.772l3.04 2.696-1.677 1.891-3.04-2.696a13.066 13.066 0 0 1-4.132-7.156l-.49-2.397-1.214 3.642a10.54 10.54 0 0 0 0 6.666l1.285 3.855-2.4.8-1.285-3.855a13.069 13.069 0 0 1 0-8.265l.773-2.324-2.873 2.55a10.542 10.542 0 0 0-3.332 5.773l-.815 3.98-2.476-.508.814-3.98a13.07 13.07 0 0 1 4.132-7.157l1.83-1.625-3.761.77A10.539 10.539 0 0 0 7.3 29.603l-2.697 3.04-1.891-1.677 2.696-3.04a13.066 13.066 0 0 1 7.156-4.133l2.398-.492-3.643-1.213a10.54 10.54 0 0 0-6.666 0L.8 23.372 0 20.973l3.855-1.285a13.069 13.069 0 0 1 8.264 0l2.32.773-2.547-2.872a10.539 10.539 0 0 0-5.772-3.333l-3.98-.815.506-2.476 3.981.814a13.069 13.069 0 0 1 7.158 4.133l1.62 1.828-.767-3.76a10.537 10.537 0 0 0-3.332-5.771l-3.04-2.696 1.677-1.894 3.04 2.696a13.069 13.069 0 0 1 4.133 7.158l.49 2.399 1.215-3.644a10.54 10.54 0 0 0 0-6.666l-1.284-3.854 2.398-.8 1.285 3.855ZM20 16.957a3.953 3.953 0 0 0-3.951 3.951l.021.404a3.951 3.951 0 0 0 7.86 0l.02-.404-.02-.404a3.952 3.952 0 0 0-3.526-3.525L20 16.957Z";

const SF_FONT =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif";
const SF_DISPLAY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif";

function useIsDarkTheme() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && resolvedTheme === "dark";
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
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
      <svg
        width={iconScale}
        height={iconScale}
        viewBox="0 0 40 41"
        fill="#fff"
      >
        <path d={MIDDAY_LOGO_PATH} />
      </svg>
    </div>
  );
}

function ContactAvatar() {
  return (
    <div
      className="flex items-center justify-center"
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background:
          "radial-gradient(circle at 50% 28%, #776d92 0%, #5e5578 34%, #40384f 72%, #2a2534 100%)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 24px rgba(0,0,0,0.28)",
      }}
    >
      <svg
        width="38"
        height="38"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="8.2" r="4.1" fill="rgba(255,255,255,0.96)" />
        <path
          d="M5.2 20.1C5.9 16.6 8.6 14.6 12 14.6C15.4 14.6 18.1 16.6 18.8 20.1"
          fill="rgba(255,255,255,0.96)"
        />
      </svg>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status bar (rendered inside the screen, adapts to light/dark)     */
/* ------------------------------------------------------------------ */

function StatusBar({ dark }: { dark?: boolean }) {
  const [now, setNow] = useState<Date | null>(null);
  const color = dark ? "#000" : "#fff";

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

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
        {now ? formatTime(now) : "\u00A0"}
      </span>

      <svg
        width="78"
        height="14"
        viewBox="0 0 78 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0" y="9" width="3.2" height="4.5" rx="0.8" fill={color} />
        <rect
          x="4.6"
          y="6.5"
          width="3.2"
          height="7"
          rx="0.8"
          fill={color}
        />
        <rect x="9.2" y="4" width="3.2" height="9.5" rx="0.8" fill={color} />
        <rect
          x="13.8"
          y="0.5"
          width="3.2"
          height="13"
          rx="0.8"
          fill={color}
        />
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
          <rect
            x="1.5"
            y="1.5"
            width="21"
            height="9"
            rx="2.5"
            fill={color}
          />
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
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now ? now.getHours() % 12 || 12 : 12;
  const minutes = now ? now.getMinutes().toString().padStart(2, "0") : "00";
  const timeStr = `${hours}:${minutes}`;
  const dateStr = now ? formatDate(now) : "\u00A0";

  return (
    <div className="absolute inset-0 flex flex-col items-center">
      {/* Wallpaper image */}
      <img
        src="/images/chat-lock-wallpaper.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        style={{ zIndex: 0 }}
      />
      {/* Slight dark overlay for readability */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.15)", zIndex: 1 }}
      />

      <StatusBar />
      <HomeIndicator />

      {/* Liquid Glass clock */}
      <div
        style={{
          marginTop: 94,
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "0 10px",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: "-8px 0",
              borderRadius: 36,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04))",
              backdropFilter: "blur(18px)",
              WebkitBackdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(255,255,255,0.03), 0 0 30px rgba(255,255,255,0.04)",
              opacity: 0.55,
            }}
          />
          <div
            style={{
              position: "relative",
              fontSize: 92,
              fontWeight: 250,
              color: "rgba(255,255,255,0.82)",
              fontFamily: SF_DISPLAY,
              lineHeight: 1,
              letterSpacing: -4,
              textShadow:
                "0 1px 0 rgba(255,255,255,0.22), 0 0 28px rgba(255,255,255,0.08)",
            }}
          >
            {timeStr}
          </div>
        </div>

        <div
          style={{
            marginTop: 2,
            fontSize: 20,
            fontWeight: 500,
            color: "rgba(255,255,255,0.78)",
            fontFamily: SF_FONT,
            textShadow: "0 1px 10px rgba(255,255,255,0.08)",
          }}
        >
          {dateStr}
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
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.71.71M1 12h1M20.07 4.93l-.71.71M23 12h-1" />
            <path d="M15 8a3 3 0 0 0-6 0c0 3 3 6 3 10h0c0-4 3-7 3-10z" />
          </svg>
        </div>

        {/* Camera */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.18)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 16px rgba(0,0,0,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.85)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification banner — iOS 26 Liquid Glass                          */
/* ------------------------------------------------------------------ */

function NotificationBanner({ tapped }: { tapped: boolean }) {
  return (
    <motion.div
      initial={{ y: -120, opacity: 0 }}
      animate={
        tapped
          ? { y: -120, opacity: 0, scale: 0.95 }
          : { y: 0, opacity: 1, scale: 1 }
      }
      transition={
        tapped
          ? { duration: 0.25, ease: "easeIn" }
          : { type: "spring", damping: 25, stiffness: 300 }
      }
      className="absolute flex items-start gap-3"
        style={{
          top: 66,
        left: 16,
        right: 16,
        zIndex: 30,
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
          Invoice #1042 is 14 days overdue &mdash; $2,400 from Acme Corp. Want
          me to send a reminder?
        </p>
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
/*  Message bubble                                                     */
/* ------------------------------------------------------------------ */

function MessageBubble({
  message,
  isDark,
}: {
  message: ChatMessage;
  isDark: boolean;
}) {
  const isUser = message.sender === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
      style={{ padding: "2px 16px" }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "9px 14px",
          fontSize: 15.5,
          lineHeight: 1.35,
          color: isUser ? "#fff" : isDark ? "#fff" : "#000",
          backgroundColor: isUser ? "#007AFF" : isDark ? "#2C2C2E" : "#E9E9EB",
          borderRadius: isUser
            ? "18px 18px 4px 18px"
            : "18px 18px 18px 4px",
          fontFamily: SF_FONT,
        }}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Chat view — iOS 26 Liquid Glass iMessage                           */
/* ------------------------------------------------------------------ */

function ChatView({
  messages,
  isTyping,
}: {
  messages: ChatMessage[];
  isTyping: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDark = useIsDarkTheme();
  const toolbarBackground = isDark
    ? "linear-gradient(180deg, rgba(34,34,36,0.82), rgba(26,26,28,0.74))"
    : "linear-gradient(180deg, rgba(252,252,252,0.82), rgba(244,244,246,0.74))";
  const toolbarBorder = isDark
    ? "rgba(255,255,255,0.08)"
    : "rgba(0,0,0,0.08)";

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
          padding: "8px 14px 14px",
          background: isDark ? "#000" : "#fff",
        }}
      >
        <div className="flex items-start justify-between">
          <div
            className="flex items-center gap-2"
            style={{
              minWidth: 88,
              height: 36,
              padding: "0 12px",
              borderRadius: 18,
              background: isDark ? "#242426" : "#efeff1",
            }}
          >
            <svg
              width="10"
              height="16"
              viewBox="0 0 10 18"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.5 1.5L2 9L8.5 16.5"
                stroke={isDark ? "#FFFFFF" : "#000000"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              style={{
                fontSize: 16,
                fontWeight: 400,
                color: isDark ? "#FFFFFF" : "#000000",
                fontFamily: SF_FONT,
                letterSpacing: -0.2,
              }}
            >
              1110
            </span>
          </div>

          <div
            className="flex items-center justify-center"
            style={{ minWidth: 88 }}
          >
            <div
              className="flex items-center justify-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: isDark ? "#242426" : "#efeff1",
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15.6 7.8H8.4C7.07452 7.8 6 8.87452 6 10.2V13.8C6 15.1255 7.07452 16.2 8.4 16.2H15.6C16.9255 16.2 18 15.1255 18 13.8V10.2C18 8.87452 16.9255 7.8 15.6 7.8Z"
                  stroke={isDark ? "#FFFFFF" : "#000000"}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M18 10.9L21 8.8V15.2L18 13.1V10.9Z"
                  stroke={isDark ? "#FFFFFF" : "#000000"}
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center"
          style={{ marginTop: 8 }}
        >
          <ContactAvatar />

          <div
            style={{
              marginTop: 10,
              minHeight: 32,
              padding: "0 14px",
              borderRadius: 16,
              background: isDark ? "#2a2a2d" : "#efeff1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: isDark ? "#FFFFFF" : "#000000",
                fontFamily: SF_FONT,
                letterSpacing: -0.2,
              }}
            >
              +1 (645) 221-7751
            </span>
            <span
              style={{
                marginLeft: 5,
                fontSize: 18,
                lineHeight: 1,
                color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)",
              }}
            >
              ›
            </span>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 15,
              fontWeight: 400,
              color: isDark ? "rgba(255,255,255,0.62)" : "rgba(0,0,0,0.55)",
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
              color: isDark ? "rgba(255,255,255,0.42)" : "rgba(0,0,0,0.38)",
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
                fill={isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.34)"}
              />
              <path
                d="M2.4 4.3V3.3C2.4 2.24 3.11 1.4 4 1.4C4.89 1.4 5.6 2.24 5.6 3.3V4.3"
                stroke={isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.34)"}
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
        style={{
          paddingTop: 6,
          paddingBottom: 8,
          scrollBehavior: "smooth",
          background: isDark ? "#000000" : "#FFFFFF",
        }}
      >
        <div className="flex flex-col gap-1">
          <AnimatePresence mode="popLayout">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} isDark={isDark} />
            ))}
          </AnimatePresence>
          {isTyping && <TypingIndicator isDark={isDark} />}
        </div>
      </div>

      {/* Liquid Glass input bar */}
      <div
        className="flex items-center gap-2"
        style={{
          padding: "6px 12px 28px",
          background: toolbarBackground,
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          borderTop: `0.5px solid ${toolbarBorder}`,
          boxShadow: isDark
            ? "inset 0 1px 0 rgba(255,255,255,0.04)"
            : "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        <div
          className="flex items-center justify-center"
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3v10M3 8h10"
              stroke={isDark ? "#B0B0B5" : "#8E8E93"}
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div
          className="flex-1"
          style={{
            height: 36,
            borderRadius: 18,
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: 14,
            paddingRight: 10,
          }}
        >
          <span
            style={{
              fontSize: 15,
              color: isDark ? "#8E8E93" : "#C7C7CC",
              fontFamily: SF_FONT,
            }}
          >
            iMessage
          </span>
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8 7H16M8 12H13M6.5 19L4.5 20.5L5.2 17.6C3.86 16.45 3 14.77 3 12.9C3 9.37 6.13 6.5 10 6.5H14C17.87 6.5 21 9.37 21 12.9C21 16.43 17.87 19.3 14 19.3H6.5Z"
                stroke={isDark ? "rgba(255,255,255,0.52)" : "rgba(0,0,0,0.38)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 15.5A3.5 3.5 0 0 0 15.5 12V8.5A3.5 3.5 0 1 0 8.5 8.5V12A3.5 3.5 0 0 0 12 15.5ZM12 15.5V19M9 19H15"
                stroke={isDark ? "rgba(255,255,255,0.52)" : "rgba(0,0,0,0.38)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>

      <HomeIndicator dark={!isDark} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main animation controller                                          */
/* ------------------------------------------------------------------ */

export function ChatIMessageAnimation() {
  const [phase, setPhase] = useState<"lock" | "chat">("lock");
  const [showNotification, setShowNotification] = useState(false);
  const [notificationTapped, setNotificationTapped] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [cycle, setCycle] = useState(0);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimeouts = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  const schedule = useCallback((fn: () => void, delay: number) => {
    timeoutsRef.current.push(setTimeout(fn, delay));
  }, []);

  useEffect(() => {
    clearTimeouts();
    setPhase("lock");
    setShowNotification(false);
    setNotificationTapped(false);
    setMessages([]);
    setIsTyping(false);

    let t = 0;

    t += 3000;

    schedule(() => setShowNotification(true), t);
    t += 2000;

    schedule(() => setNotificationTapped(true), t);
    t += 350;
    schedule(() => {
      setShowNotification(false);
      setNotificationTapped(false);
      setPhase("chat");
    }, t);
    t += 400;

    let msgId = 0;
    for (const entry of CONVERSATION) {
      if (entry.sender === "midday" && entry.typingMs) {
        const capturedT = t;
        schedule(() => setIsTyping(true), capturedT);
        t += entry.typingMs;
      }

      const currentId = msgId++;
      const capturedText = entry.text;
      const capturedSender = entry.sender;
      const capturedT2 = t;

      schedule(() => {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: currentId, sender: capturedSender, text: capturedText },
        ]);
      }, capturedT2);

      t += entry.delayAfterMs ?? 500;
    }

    t += 3000;
    schedule(() => setCycle((c) => c + 1), t);

    return clearTimeouts;
  }, [cycle, clearTimeouts, schedule]);

  return (
    <div className="relative w-full h-full" style={{ background: "#000" }}>
      <AnimatePresence mode="wait">
        {phase === "lock" && (
          <motion.div
            key="lock"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <LockScreen />
            {showNotification && (
              <NotificationBanner tapped={notificationTapped} />
            )}
          </motion.div>
        )}

        {phase === "chat" && (
          <motion.div
            key="chat"
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ChatView messages={messages} isTyping={isTyping} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
