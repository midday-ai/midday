import { useEffect, useState } from "react";

function isWebGLDisabled(): boolean {
  const canvas = document.createElement("canvas");
  const gl =
    canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  return !gl;
}

export function useWebGL() {
  const [webglDisabled, setWebGLDisabled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const disabled = isWebGLDisabled();
      setWebGLDisabled(disabled);
    }
  }, []);

  return { webglDisabled };
}
