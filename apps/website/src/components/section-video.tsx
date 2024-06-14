"use client";

import { Button } from "@midday/ui/button";
import { cn } from "@midday/ui/cn";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
});

export function SectionVideo() {
  const playerRef = useRef();
  const [isPlaying, setPlaying] = useState(false);
  const [inViewport, setInViewport] = useState(false);

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pause();
    } else {
      playerRef.current?.play();
    }

    setPlaying((prev) => !prev);
  };

  return (
    <motion.div
      className="flex flex-col justify-center container pb-20"
      onViewportEnter={() => {
        setTimeout(() => {
          setInViewport(true);
        }, 300);
      }}
      onViewportLeave={() => {
        setInViewport(false);
      }}
    >
      <div className="relative">
        <div
          className={cn(
            "absolute top-4 right-4 space-x-4 items-center justify-center opacity-0 z-30 transition-all",
            inViewport && !isPlaying && "opacity-100"
          )}
        >
          <Button
            size="icon"
            className="rounded-full size-14"
            onClick={togglePlay}
          >
            <Icons.PlayOutline size={24} />
          </Button>
        </div>

        <ReactHlsPlayer
          onClick={togglePlay}
          src="https://customer-oh6t55xltlgrfayh.cloudflarestream.com/306702a5d5efbba0e9bcdd7cb17e9c5a/manifest/video.m3u8"
          autoPlay={false}
          poster="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/poster.png"
          playerRef={playerRef}
          className="w-full"
        />
      </div>
    </motion.div>
  );
}
