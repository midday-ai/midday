"use client";

import { useEffect, useState } from "react";

export function Countdown() {
  const countDownDate = new Date("2024-06-26");

  const getTimeDifference = (countDownTime) => {
    const currentTime = new Date().getTime();
    const timeDiffrence = countDownTime - currentTime;
    const days =
      Math.floor(timeDiffrence / (24 * 60 * 60 * 1000)) >= 10
        ? Math.floor(timeDiffrence / (24 * 60 * 60 * 1000))
        : `0${Math.floor(timeDiffrence / (24 * 60 * 60 * 1000))}`;
    const hours =
      Math.floor((timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60)) >=
      10
        ? Math.floor((timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60))
        : `0${Math.floor(
            (timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60),
          )}`;
    const minutes =
      Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60)) >= 10
        ? Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60))
        : `0${Math.floor((timeDiffrence % (60 * 60 * 1000)) / (1000 * 60))}`;
    const seconds =
      Math.floor((timeDiffrence % (60 * 1000)) / 1000) >= 10
        ? Math.floor((timeDiffrence % (60 * 1000)) / 1000)
        : `0${Math.floor((timeDiffrence % (60 * 1000)) / 1000)}`;

    if (timeDiffrence < 0) {
      clearInterval();

      return {
        days: "00",
        hours: "00",
        minutes: "00",
        seconds: "00",
      };
    }

    return {
      days: days,
      hours: hours,
      minutes: minutes,
      seconds: seconds,
    };
  };

  const [countDownTime, setCountDownTIme] = useState(
    getTimeDifference(countDownDate),
  );

  useEffect(() => {
    setInterval(() => {
      setCountDownTIme(getTimeDifference(countDownDate.getTime()));
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 sm:gap-16">
      <div className="flex justify-center gap-3 sm:gap-8">
        <div className="relative flex flex-col">
          <div className="flex h-16 w-16 items-center justify-between sm:h-32 sm:w-32 lg:h-[230px] lg:w-[230px]">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-dotted font-mono text-6xl font-medium sm:text-6xl lg:text-[174px]">
              {countDownTime?.days}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-sm font-medium capitalize">
            {countDownTime?.days === 1 ? "Day" : "Days"}
          </span>
        </div>
        <div className="relative flex flex-col">
          <div className="flex h-16 w-16 items-center justify-between sm:h-32 sm:w-32 lg:h-[230px] lg:w-[230px]">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-dotted font-mono text-6xl font-medium sm:text-6xl lg:text-[174px]">
              {countDownTime?.hours}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-sm font-medium">
            {countDownTime?.hours === 1 ? "Hour" : "Hours"}
          </span>
        </div>
        <div className="relative flex flex-col">
          <div className="flex h-16 w-16 items-center justify-between sm:h-32 sm:w-32 lg:h-[230px] lg:w-[230px]">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-dotted font-mono text-6xl font-medium sm:text-6xl lg:text-[174px]">
              {countDownTime?.minutes}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-sm font-medium capitalize">
            {countDownTime?.minutes === 1 ? "Minute" : "Min"}
          </span>
        </div>
        <div className="relative flex flex-col">
          <div className="flex h-16 w-16 items-center justify-between sm:h-32 sm:w-32 lg:h-[230px] lg:w-[230px]">
            <div className="relative !-left-[6px] h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-dotted font-mono text-6xl font-medium sm:text-6xl lg:text-[174px]">
              {countDownTime?.seconds}
            </span>
            <div className="relative -right-[6px] h-2.5 w-2.5 font-medium sm:h-3 sm:w-3" />
          </div>
          <span className="text-center text-sm font-medium capitalize">
            {countDownTime?.seconds === 1 ? "Second" : "Sec"}
          </span>
        </div>
      </div>
    </div>
  );
}
