"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  isDemoMuted,
  onDemoMuteChange,
  toggleDemoMute,
} from "./animations/chat-demo-animation";

const SCREEN_PATH =
  "M113.81 20.4039C80.2907 20.4039 63.5312 20.4036 50.7286 27.0752C39.467 32.9438 30.3109 42.3083 24.5729 53.8261C18.0497 66.92 18.05 84.0608 18.05 118.3428V771.6572C18.05 805.9407 18.0497 823.08 24.5729 836.1725C30.3109 847.691 39.467 857.0574 50.7286 862.9259C63.5312 869.5961 80.2907 869.5961 113.81 869.5961H304.19C337.7093 869.5961 354.4688 869.5961 367.2714 862.9259C378.5332 857.0574 387.6893 847.691 393.4273 836.1725C399.9505 823.08 399.95 805.9407 399.95 771.6572V118.3428C399.95 84.0608 399.9505 66.92 393.4273 53.8261C387.6893 42.3083 378.5332 32.9438 367.2714 27.0752C354.4688 20.4036 337.7093 20.4039 304.19 20.4039H113.81Z";
const CONTENT_WIDTH = 418;
const CONTENT_HEIGHT = 890;
const SCREEN_LEFT = 18.05;
const SCREEN_TOP = 20.4;
const SCREEN_WIDTH = 381.9;
const SCREEN_HEIGHT = 849.2;
const SCREEN_SCALE_X = SCREEN_WIDTH / CONTENT_WIDTH;
const SCREEN_SCALE_Y = SCREEN_HEIGHT / CONTENT_HEIGHT;

const SILENT_BANNER_HOLD_MS = 1600;

/*
 * Dynamic Island geometry extracted from the iPhone 17 Pro SVG (880×1832).
 * SVG mask pill: x 316–564, y 70–142  →  scaled to 418×890 render space.
 */
const DI_TOP = 24;
const DI_WIDTH = 118;
const DI_HEIGHT = 35;
const DI_EXPANDED_WIDTH = 220;
const DI_EXPANDED_HEIGHT = 54;

function SilentBellIcon({ muted }: { muted: boolean }) {
  const color = muted ? "#FF3B30" : "#fff";
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12 2C10.9 2 10 2.9 10 4V4.29C7.12 5.14 5 7.82 5 11V17L3 19V20H21V19L19 17V11C19 7.82 16.88 5.14 14 4.29V4C14 2.9 13.1 2 12 2ZM10 21C10 22.1 10.9 23 12 23C13.1 23 14 22.1 14 21H10Z"
        fill={color}
      />
      {muted && (
        <line
          x1="3"
          y1="2"
          x2="21"
          y2="22"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

function SilentBanner() {
  const [visible, setVisible] = useState(false);
  const [muted, setMuted] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return onDemoMuteChange((m) => {
      setMuted(m);
      if (timerRef.current) clearTimeout(timerRef.current);
      setVisible(true);
      timerRef.current = setTimeout(() => {
        setVisible(false);
        timerRef.current = null;
      }, SILENT_BANNER_HOLD_MS);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="silent-banner"
          initial={{
            width: DI_WIDTH,
            height: DI_HEIGHT,
            borderRadius: DI_HEIGHT / 2,
            opacity: 0.6,
          }}
          animate={{
            width: DI_EXPANDED_WIDTH,
            height: DI_EXPANDED_HEIGHT,
            borderRadius: DI_EXPANDED_HEIGHT / 2,
            opacity: 1,
          }}
          exit={{
            width: DI_WIDTH,
            height: DI_HEIGHT,
            borderRadius: DI_HEIGHT / 2,
            opacity: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 28,
            mass: 0.7,
          }}
          style={{
            position: "absolute",
            top: DI_TOP,
            left: "50%",
            x: "-50%",
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            zIndex: 60,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.08, duration: 0.12 }}
            style={{ display: "flex", alignItems: "center" }}
          >
            <SilentBellIcon muted={muted} />
          </motion.div>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.15 }}
            style={{
              color: muted ? "#FF3B30" : "#fff",
              fontSize: 15,
              fontWeight: 600,
              fontFamily:
                '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif',
              letterSpacing: -0.2,
            }}
          >
            {muted ? "Silent" : "Ring"}
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MuteSwitch() {
  const [muted, setMuted] = useState(isDemoMuted);

  useEffect(() => onDemoMuteChange(setMuted), []);

  const toggle = useCallback(() => {
    toggleDemoMute();
  }, []);

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      onClick={toggle}
      style={{
        position: "absolute",
        left: -4,
        top: 186,
        width: 20,
        height: 41,
        zIndex: 40,
        cursor: "pointer",
        background: "transparent",
        border: "none",
        padding: 0,
      }}
    />
  );
}

export function IPhoneMock({
  children,
  className,
  isDark = true,
  style: styleProp,
}: {
  children: ReactNode;
  className?: string;
  isDark?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        width: 418,
        height: 890,
        position: "relative",
        filter: "none",
        ...styleProp,
      }}
    >
      {/* Screen content — clipped to the screen opening */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `path('${SCREEN_PATH}')` }}
      >
        <div
          style={{
            position: "absolute",
            left: SCREEN_LEFT,
            top: SCREEN_TOP,
            width: CONTENT_WIDTH,
            height: CONTENT_HEIGHT,
            transform: `scale(${SCREEN_SCALE_X}, ${SCREEN_SCALE_Y})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>

      <img
        src="https://cdn.midday.ai/iphone-17-pro-silver.svg"
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full pointer-events-none select-none"
        draggable={false}
      />

      <SilentBanner />
      <MuteSwitch />
    </div>
  );
}
