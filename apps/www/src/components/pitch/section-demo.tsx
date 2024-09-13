"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
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
    <div className="relative min-h-screen w-screen">
      <div className="absolute left-4 right-4 top-4 flex justify-between text-lg md:left-8 md:right-8">
        <span>Demo - Version 0.5 (Private beta)</span>
        <span className="text-[#878787]">
          <Link href="/">Solomon AI </Link>
        </span>
      </div>
      <div className="container flex min-h-screen flex-col justify-center p-[5%]">
        <div className="group">
          <div className="absolute left-[50%] top-[50%] z-30 -ml-[100px] -mt-[50px] hidden h-[50px] w-[200px] items-center justify-center space-x-4 opacity-0 transition-all group-hover:opacity-100 md:flex">
            <Button
              size="icon"
              className="h-14 w-14 rounded-full border border-white bg-transparent text-white hover:bg-transparent"
              onClick={handleRestart}
            >
              <Icons.Reply size={24} />
            </Button>
            <Button
              size="icon"
              className="h-14 w-14 rounded-full"
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
            className="m-auto mt-8 max-h-[90%] w-full max-w-[1280px] bg-[#121212] lg:max-h-full"
            loop
          />
        </div>
      </div>
    </div>
  );
}
