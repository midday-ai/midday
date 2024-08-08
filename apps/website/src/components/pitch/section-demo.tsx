"use client";

import { Button } from "@midday/ui/button";
import { useMediaQuery } from "@midday/ui/hooks";
import { Icons } from "@midday/ui/icons";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

type Props = {
  playVideo: boolean;
};

export function SectionDemo({ playVideo }: Props) {
  const playerRef = useRef();
  const [isPlaying, setPlaying] = useState(true);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useHotkeys(
    "space",
    () => {
      togglePlay();
    },
    [],
  );

  useHotkeys(
    "backspace",
    () => {
      handleRestart();
    },
    [playerRef],
  );

  useEffect(() => {
    if (isDesktop) {
      if (playVideo) {
        togglePlay();
      } else {
        togglePlay();
      }
    }
  }, [playVideo, isDesktop]);

  const handleRestart = () => {
    playerRef.current.currentTime = 0;
  };

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }

    setPlaying((prev) => !prev);
  };

  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-4 right-4 md:left-8 md:right-8 top-4 flex justify-between text-lg">
        <span>Demo - Version 0.5 (Private beta)</span>
        <span className="text-[#878787]">
          <Link href="/">midday.ai</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="group">
          <div className="absolute top-[50%] left-[50%] w-[200px] h-[50px] -ml-[100px] -mt-[50px] group-hover:opacity-100 hidden md:flex space-x-4 items-center justify-center opacity-0 z-30 transition-all">
            <Button
              size="icon"
              className="rounded-full w-14 h-14 bg-transparent border border-white text-white hover:bg-transparent"
              onClick={handleRestart}
            >
              <Icons.Reply size={24} />
            </Button>
            <Button
              size="icon"
              className="rounded-full w-14 h-14"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Icons.PauseOutline size={24} />
              ) : (
                <Icons.PlayOutline size={24} />
              )}
            </Button>
          </div>
          <ReactHlsPlayer
            onClick={togglePlay}
            src="https://customer-oh6t55xltlgrfayh.cloudflarestream.com/3c8ebd39be71d2451dee78d497b89a23/manifest/video.m3u8"
            autoPlay={false}
            controls={!isDesktop}
            playerRef={playerRef}
            className="w-full max-h-[90%] lg:max-h-full mt-8 bg-[#121212] max-w-[1280px] m-auto"
            loop
          />
        </div>
      </div>
    </div>
  );
}
