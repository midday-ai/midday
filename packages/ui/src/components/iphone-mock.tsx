"use client";

import type { CSSProperties, ReactNode } from "react";

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
      {/* Screen content — clipped to the screen opening from the provided SVG */}
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
    </div>
  );
}
