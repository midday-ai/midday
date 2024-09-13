"use client";

import { useEffect, useRef } from "react";

export function DevMessage() {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current) {
      console.log(`
      -------------------------------------------------
        ███╗   ███╗██╗██████╗ ██████╗  █████╗ ██╗   ██╗
      ████╗ ████║██║██╔══██╗██╔══██╗██╔══██╗╚██╗ ██╔╝
      ██╔████╔██║██║██║  ██║██║  ██║███████║ ╚████╔╝ 
      ██║╚██╔╝██║██║██║  ██║██║  ██║██╔══██║  ╚██╔╝  
      ██║ ╚═╝ ██║██║██████╔╝██████╔╝██║  ██║   ██║   
      ╚═╝     ╚═╝╚═╝╚═════╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝   
      -------------------------------------------------
    We are open source: https://github.com/SolomonAIEngineering/orbitkit
    Join the community: https://go.solomon-ai.app/anPiuRx
    
    `);
      ref.current = true;
    }
  }, []);

  return null;
}
