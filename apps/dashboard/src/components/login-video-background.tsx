"use client";

import { Icons } from "@midday/ui/icons";
import { useEffect, useRef, useState } from "react";
import LoginTestimonials from "./login-testimonials";

export function LoginVideoBackground() {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsVideoLoaded(true);
    };

    const handleLoadedData = () => {
      setIsVideoLoaded(true);
    };

    const handleCanPlayThrough = () => {
      setIsVideoLoaded(true);
    };

    // Check if video is already loaded
    if (video.readyState >= 3) {
      setIsVideoLoaded(true);
    }

    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplaythrough", handleCanPlayThrough);

    return () => {
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
    };
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden m-2">
      {/* Poster image with blur effect */}
      <div
        className={`absolute inset-0 w-full h-full transition-all duration-1000 ease-in-out ${
          isVideoLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        style={{
          filter: isVideoLoaded ? "blur(0px)" : "blur(1px)",
        }}
      >
        <img
          src="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/video-poster-v2.jpg"
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
          isVideoLoaded ? "opacity-100" : "opacity-0"
        }`}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/video-poster-v2.jpg"
      >
        <source
          src="https://pub-842eaa8107354d468d572ebfca43b6e3.r2.dev/videos/login-video.mp4"
          type="video/mp4"
        />
      </video>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20" />

      {/* Logo */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="p-4">
          <Icons.LogoSmall className="h-6 w-auto text-white" />
        </div>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex flex-col justify-center items-center p-2 text-center h-full w-full">
        <div className="max-w-lg">
          <LoginTestimonials />
        </div>
      </div>
    </div>
  );
}
