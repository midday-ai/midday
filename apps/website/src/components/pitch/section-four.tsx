"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef } from "react";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export function SectionFour() {
  const playerRef = useRef();
  const isPlaying = useRef<HTMLVideoElement>(null);

  const handleOnPlay = () => {
    if (isPlaying.current) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
    isPlaying.current = !isPlaying.current;
  };

  return (
    <div className="h-screen relative w-screen container">
      <div className="absolute left-0 right-0 top-4 flex justify-between">
        <span>Demo - Version 0.5 (Private beta)</span>
        <span className="text-[#878787]">
          <Link href="/">Midday</Link>
        </span>
      </div>

      <div className="flex flex-col h-screen min-h-full justify-center">
        <div className="flex justify-between space-x-8">
          <div>
            <ReactHlsPlayer
              onClick={handleOnPlay}
              src="https://customer-oh6t55xltlgrfayh.cloudflarestream.com/3c8ebd39be71d2451dee78d497b89a23/manifest/video.m3u8"
              autoPlay={false}
              controls={false}
              playerRef={playerRef}
              className="w-full"
            />
          </div>

          <div className="w-[575px]">
            <h2 className="mb-8">Features in this demo</h2>

            <div>
              <ul className="h-full overflow-auto space-y-4 max-h-[580px]">
                <li className="border border-border rounded-xl p-4">
                  <span className="mb-2 block">Overview</span>
                  <p className="text-xs text-[#878787]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse cursus venenatis neque, sit amet maximus ex. Sed
                    nisl augue, bibendum eu vehicula nec, eleifend ac risus.
                    Vivamus porta arcu nec magna mollis vestibulum a nec augue.
                    Aliquam imperdiet hendrerit mi non blandit.
                  </p>
                </li>

                <li className="border border-border rounded-xl p-4">
                  <span className="mb-2 block">Overview</span>
                  <p className="text-xs text-[#878787]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse cursus venenatis neque, sit amet maximus ex. Sed
                    nisl augue, bibendum eu vehicula nec, eleifend ac risus.
                    Vivamus porta arcu nec magna mollis vestibulum a nec augue.
                    Aliquam imperdiet hendrerit mi non blandit.
                  </p>
                </li>
                <li className="border border-border rounded-xl p-4">
                  <span className="mb-2 block">Overview</span>
                  <p className="text-xs text-[#878787]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse cursus venenatis neque, sit amet maximus ex. Sed
                    nisl augue, bibendum eu vehicula nec, eleifend ac risus.
                    Vivamus porta arcu nec magna mollis vestibulum a nec augue.
                    Aliquam imperdiet hendrerit mi non blandit.
                  </p>
                </li>
                <li className="border border-border rounded-xl p-4">
                  <span className="mb-2 block">Overview</span>
                  <p className="text-xs text-[#878787]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse cursus venenatis neque, sit amet maximus ex. Sed
                    nisl augue, bibendum eu vehicula nec, eleifend ac risus.
                    Vivamus porta arcu nec magna mollis vestibulum a nec augue.
                    Aliquam imperdiet hendrerit mi non blandit.
                  </p>
                </li>
                <li className="border border-border rounded-xl p-4">
                  <span className="mb-2 block">Overview</span>
                  <p className="text-xs text-[#878787]">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                    Suspendisse cursus venenatis neque, sit amet maximus ex. Sed
                    nisl augue, bibendum eu vehicula nec, eleifend ac risus.
                    Vivamus porta arcu nec magna mollis vestibulum a nec augue.
                    Aliquam imperdiet hendrerit mi non blandit.
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
