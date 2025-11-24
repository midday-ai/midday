"use client";

import { useEffect, useRef } from "react";

export function DevMessage() {
  const ref = useRef(undefined);

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
    We are open source: https://git.new/midday
    Join the community: https://go.er0s.co/anPiuRx
    
    `);
      ref.current = true;
    }
  }, []);

  return null;
}
