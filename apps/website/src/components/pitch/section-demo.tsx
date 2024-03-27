"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef } from "react";
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
  const isPlaying = useRef<HTMLVideoElement>(null);

  useHotkeys(
    "space",
    () => {
      togglePlay();
    },
    []
  );

  useHotkeys(
    "backspace",
    () => {
      playerRef.current.currentTime = 0;
    },
    [playerRef]
  );

  useEffect(() => {
    if (playVideo) {
      togglePlay();
    } else {
      togglePlay();
    }
  }, [playVideo]);

  const togglePlay = () => {
    if (isPlaying.current) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }
    isPlaying.current = !isPlaying.current;
  };

  return (
    <div className="min-h-screen relative w-screen">
      <div className="absolute left-8 right-8 top-4 flex justify-between">
        <span>Demo - Version 0.5 (Private beta)</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>
      <div className="flex flex-col min-h-screen justify-center container">
        <div className="flex justify-between space-x-8">
          <div>
            <ReactHlsPlayer
              onClick={togglePlay}
              src="https://customer-oh6t55xltlgrfayh.cloudflarestream.com/3c8ebd39be71d2451dee78d497b89a23/manifest/video.m3u8"
              autoPlay={false}
              controls={false}
              playerRef={playerRef}
              className="w-full max-h-[90%] lg:max-h-full mt-8"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
