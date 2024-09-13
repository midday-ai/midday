"use client";

import { useMediaQuery } from "@/hooks/use-media-query";
import createGlobe from "cobe";
import { useEffect, useRef, useState } from "react";

const SIZE = 850;

// https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Detect_WebGL
function isWebGLContext() {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

  return gl instanceof WebGLRenderingContext;
}

export function Globe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useMediaQuery(
    "(prefers-reduced-motion: reduce)",
  );
  const [disabledWebGL, setDisabledWebGL] = useState(false);

  useEffect(() => {
    let phi = 0;
    if (!canvasRef.current) return;
    if (!document) return;
    if (!isWebGLContext()) {
      setDisabledWebGL(true);
      return;
    }

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: 2,
      width: SIZE * 2,
      height: SIZE * 2,
      phi: 0,
      theta: 0,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor: [0.3, 0.3, 0.3],
      markerColor: [1, 1, 1],
      glowColor: [1, 1, 1],
      markers: [
        // AMS
        { location: [52.3676, 4.9041], size: 0.05 },
        // IAD
        { location: [39.0438, -77.4874], size: 0.05 },
        // JNB
        { location: [-26.2041, 28.0473], size: 0.05 },
        // HKG
        { location: [22.3193, 114.1694], size: 0.05 },
        // SYD
        { location: [-33.8688, 151.2093], size: 0.05 },
        // GRU
        { location: [-23.5558, -46.6396], size: 0.05 },
      ],
      onRender: (state) => {
        // Called on every animation frame.
        // `state` will be an empty object, return updated params.
        if (!prefersReducedMotion) {
          state.phi = phi;
          phi += 0.003;
        }
      },
    });

    setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.style.opacity = "1";
    });

    return () => {
      globe.destroy();
    };
  }, [prefersReducedMotion]);

  if (disabledWebGL) {
    return (
      <div className="flex items-center justify-center">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold">Hint</span>: enable{" "}
          <span className="font-semibold">WebGL</span> to render the globe.
        </p>
      </div>
    );
  }

  return (
    <div className="hidden justify-center 2xl:flex">
      <canvas
        ref={canvasRef}
        style={{
          width: SIZE,
          height: SIZE,
          maxWidth: "100%",
          background: "transparent",
          aspectRatio: 1,
          opacity: 0,
          transition: "opacity 1s ease",
        }}
      />
    </div>
  );
}
