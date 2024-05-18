"use client";

import { useCallback, useEffect, useState } from "react";

export function Countdown() {
  const countDownDate = new Date("2024-06-19");

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
            (timeDiffrence % (24 * 60 * 60 * 1000)) / (1000 * 60 * 60)
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
    getTimeDifference(countDownDate)
  );

  useEffect(() => {
    setInterval(() => {
      setCountDownTIme(getTimeDifference(countDownDate.getTime()));
    }, 1000);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-8 sm:gap-16">
      <div className="flex justify-center gap-3 sm:gap-8 ">
        <div className="flex flex-col relative">
          <div className="h-16 w-16 sm:w-32 sm:h-32 lg:w-[230px] lg:h-[230px] flex justify-between items-center">
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 !-left-[6px]" />
            <span className="lg:text-[174px] sm:text-6xl text-6xl font-medium text-dotted font-mono">
              {countDownTime?.days}
            </span>
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 -right-[6px]" />
          </div>
          <span className="text-sm text-center capitalize font-medium">
            {countDownTime?.days === 1 ? "Day" : "Days"}
          </span>
        </div>
        <div className="flex flex-col relative">
          <div className="h-16 w-16 sm:w-32 sm:h-32 lg:w-[230px] lg:h-[230px] flex justify-between items-center">
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 !-left-[6px]" />
            <span className="lg:text-[174px] sm:text-6xl text-6xl font-medium text-dotted font-mono">
              {countDownTime?.hours}
            </span>
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 -right-[6px]" />
          </div>
          <span className="text-sm text-center font-medium">
            {countDownTime?.hours === 1 ? "Hour" : "Hours"}
          </span>
        </div>
        <div className="flex flex-col relative">
          <div className="h-16 w-16 sm:w-32 sm:h-32 lg:w-[230px] lg:h-[230px] flex justify-between items-center">
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 !-left-[6px]" />
            <span className="lg:text-[174px] sm:text-6xl text-6xl font-medium text-dotted font-mono">
              {countDownTime?.minutes}
            </span>
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 -right-[6px]" />
          </div>
          <span className="text-sm text-center capitalize font-medium">
            {countDownTime?.minutes === 1 ? "Minute" : "Minutes"}
          </span>
        </div>
        <div className="flex flex-col relative">
          <div className="h-16 w-16 sm:w-32 sm:h-32 lg:w-[230px] lg:h-[230px] flex justify-between items-center">
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 !-left-[6px]" />
            <span className="lg:text-[174px] sm:text-6xl text-6xl font-medium text-dotted font-mono">
              {countDownTime?.seconds}
            </span>
            <div className="relative h-2.5 w-2.5 sm:h-3 sm:w-3 -right-[6px] font-medium" />
          </div>
          <span className="text-sm text-center capitalize font-medium">
            {countDownTime?.seconds === 1 ? "Second" : "Seconds"}
          </span>
        </div>
      </div>
    </div>
  );
}
