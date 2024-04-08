"use client";

// import Tick from "@pqina/flip";
// import "@pqina/flip/dist/flip.min.css";
import { useEffect, useRef, useState } from "react";

export function FlipCounter() {
  // const divRef = useRef(null);
  // const tickRef = useRef(null);

  // const value = 90;

  // const [tickValue, setTickValue] = useState(value);

  // // Make the Tick instance and store it in the refs
  // useEffect(() => {
  //   const didInit = (tick) => {
  //     tickRef.current = tick;
  //   };

  //   const currDiv = divRef.current;
  //   const tickValue = tickRef.current;

  //   Tick.DOM.create(currDiv, {
  //     value,
  //     didInit,
  //   });
  //   return () => Tick.DOM.destroy(tickValue);
  // }, [value]);

  // // Start the Tick.down process
  // useEffect(() => {
  //   const counter = Tick.count.down(value, {
  //     format: ["y", "M", "d", "h", "m", "s"],
  //   });

  //   console.log(counter);

  //   // // When the counter updates, update React's state value
  //   // counter.onupdate = function (value) {
  //   //   setTickValue(value);
  //   // };

  //   // return () => {
  //   //   counter.timer.stop();
  //   // };
  // }, [value]);

  // When the tickValue is updated, update the Tick.DOM element
  // useEffect(() => {
  //   if (tickRef.current) {
  //     tickRef.current.value = tickValue;
  //   }
  // }, [tickValue]);

  // return (
  //   <div ref={divRef} className="tick text-[244px] font-semibold font-mono">
  //     <div data-repeat="true" aria-hidden="true" data-transform="pad(00)">
  //       <span data-view="flip" />
  //     </div>
  //   </div>
  // );
  return (
    <div className="space-x-4 md:space-x-8 flex">
      <div className="relative">
        <span className="md:text-[260px] text-[180px] leading-[230px] md:leading-[340px] font-mono font-semibold bg-background rounded-3xl border border-border px-6">
          3
        </span>
        <div className="absolute top-[50%] -mt-2 h-[3px] w-full bg-background" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] left-0 top-[50%] -mt-[15px] z-10" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] right-0 top-[50%] -mt-[15px] z-10" />
      </div>

      <div className="relative">
        <span className="md:text-[260px] text-[180px] leading-[230px] md:leading-[340px] font-mono font-semibold bg-background rounded-3xl border border-border px-6">
          0
        </span>
        <div className="absolute top-[50%] -mt-2 h-[3px] w-full bg-background" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] left-0 top-[50%] -mt-[15px] z-10" />
        <div className="absolute h-[30px] w-[4px] bg-[#878787] right-0 top-[50%] -mt-[15px] z-10" />
      </div>
    </div>
  );
}
