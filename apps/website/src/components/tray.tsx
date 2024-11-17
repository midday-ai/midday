"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";

export function Tray() {
  const [date, setDate] = useState<string | undefined>();

  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date().toISOString());
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center space-x-3 absolute top-2 right-4 md:right-6 md:top-4 scale-75 md:scale-100">
      <svg
        className="relative -top-0.5"
        xmlns="http://www.w3.org/2000/svg"
        width={14}
        height={13}
        fill="none"
      >
        <path
          fill="#F5F5F3"
          fillRule="evenodd"
          d="M6.368 0a6.47 6.47 0 0 0-2.723.728l2.723 4.715V0Zm0 7.558-2.722 4.714A6.47 6.47 0 0 0 6.368 13V7.558ZM6.934 13V7.555l2.723 4.716A6.47 6.47 0 0 1 6.934 13Zm0-7.554V0c.98.042 1.903.3 2.723.729L6.934 5.446Zm-5.771 4.55 4.716-2.722-2.723 4.715a6.54 6.54 0 0 1-1.993-1.993Zm10.976-6.99L7.424 5.728l2.723-4.716a6.54 6.54 0 0 1 1.992 1.994ZM1.162 3.005a6.54 6.54 0 0 1 1.994-1.994L5.879 5.73 1.162 3.005Zm-.283.49A6.47 6.47 0 0 0 .15 6.218h5.445L.88 3.495Zm0 6.012A6.47 6.47 0 0 1 .15 6.784h5.446L.879 9.507Zm6.828-3.289h5.443a6.47 6.47 0 0 0-.727-2.723L7.707 6.218Zm4.715 3.288L7.707 6.784h5.443a6.47 6.47 0 0 1-.728 2.722ZM7.425 7.274l2.721 4.714a6.54 6.54 0 0 0 1.993-1.992L7.425 7.274Z"
          clipRule="evenodd"
        />
      </svg>

      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={20}
        height={21}
        fill="none"
      >
        <g filter="url(#a)">
          <path
            fill="#fff"
            fillOpacity={0.9}
            fillRule="evenodd"
            d="M14.15 7.625c0 1.11-.361 2.136-.973 2.965l2.504 2.505a.75.75 0 0 1-.977 1.133l-.084-.073-2.504-2.504a5 5 0 1 1 2.035-4.026Zm-5 4a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
            clipRule="evenodd"
          />
        </g>
        <defs>
          <filter
            id="a"
            width={19.75}
            height={19.75}
            x={0.15}
            y={0.625}
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood floodOpacity={0} result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy={2} />
            <feGaussianBlur stdDeviation={2} />
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0" />
            <feBlend
              in2="BackgroundImageFix"
              result="effect1_dropShadow_2085_4748"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_2085_4748"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={25}
        height={19}
        fill="none"
      >
        <g filter="url(#a)">
          <path
            fill="#fff"
            fillOpacity={0.9}
            fillRule="evenodd"
            d="M12.75 2a9.982 9.982 0 0 1 7.85 3.804L19.12 7.16A7.987 7.987 0 0 0 12.75 4c-2.6 0-4.909 1.24-6.37 3.16L4.9 5.804A9.982 9.982 0 0 1 12.75 2Zm4.888 6.52A5.992 5.992 0 0 0 12.75 6c-2.016 0-3.8.994-4.888 2.52l1.492 1.366A3.997 3.997 0 0 1 12.75 8c1.434 0 2.69.754 3.397 1.886l1.491-1.367Zm-3.019 2.767a2 2 0 0 0-3.738 0L12.751 13l1.868-1.713Z"
            clipRule="evenodd"
          />
        </g>
        <defs>
          <filter
            id="a"
            width={23.7}
            height={19}
            x={0.9}
            y={0}
            colorInterpolationFilters="sRGB"
            filterUnits="userSpaceOnUse"
          >
            <feFlood floodOpacity={0} result="BackgroundImageFix" />
            <feColorMatrix
              in="SourceAlpha"
              result="hardAlpha"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            />
            <feOffset dy={2} />
            <feGaussianBlur stdDeviation={2} />
            <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.22 0" />
            <feBlend
              in2="BackgroundImageFix"
              result="effect1_dropShadow_2085_4753"
            />
            <feBlend
              in="SourceGraphic"
              in2="effect1_dropShadow_2085_4753"
              result="shape"
            />
          </filter>
        </defs>
      </svg>
      <span className="text-sm font-medium text-white">
        {format(new Date(), "eee d MMM")}
      </span>
      <span className="text-sm font-medium text-white">
        {date && format(new Date(date), "p")}
      </span>
    </div>
  );
}
