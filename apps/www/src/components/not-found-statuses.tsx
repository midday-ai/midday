"use client";

import { useEffect, useRef, useState } from "react";

const data = [
  {
    name: "<Status Code>",
    description: "404 Not Found",
  },
  {
    name: "<Referrer Policy>",
    description: "strict-origin-when-cross-origin",
  },
  {
    name: "<Cache-Control>",
    description: "no-store, must-revalidate",
  },
  {
    name: "<Connection>",
    description: "keep-alive",
  },
  {
    name: "<Content-Type>",
    description: "text/html; charset=utf-8",
  },
  {
    name: "<Date>",
    description: new Date().toTimeString(),
  },
  {
    name: "<X-Powered-By>",
    description: "Next.js",
  },
  {
    name: "<Project-Name>",
    description: "Solomon AI",
  },
];

export function NotFoundStatuses() {
  const [statuses, setStatuses] = useState();
  const ref = useRef(false);
  const scrollRef = useRef();

  useEffect(() => {
    setStatuses([
      {
        name: "<Request URL>",
        description: location.origin,
      },
    ]);
  }, []);

  useEffect(() => {
    let index = 1;

    function addItems() {
      const destinationArray = [];

      if (index < data.length - 1) {
        destinationArray.push(data[index]);

        setStatuses((prev) => [...prev, data[index]]);
        index++;

        scrollRef.current?.scrollTo({
          top: 10000000,
          behavior: "smooth",
          block: "end",
        });

        setTimeout(addItems, 500);
      }
    }

    if (!ref.current) {
      addItems();

      ref.current = true;
    }
  }, []);

  return (
    <ul
      className="flex h-[290px] flex-col space-y-4 overflow-auto p-4 font-mono text-xs"
      ref={scrollRef}
    >
      {statuses?.map((status) => {
        return (
          <li className="flex flex-col" key={status.name}>
            <span className="mb-1 text-[#707070]">{status.name}</span>
            <span>{status.description}</span>
          </li>
        );
      })}
    </ul>
  );
}
