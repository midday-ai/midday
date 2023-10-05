"use client";

import Image from "next/image";
import overview from "public/overview.png";
import search from "public/search.png";
import transactions from "public/transactions.png";

export function StartPage() {
  return (
    <div>
      <div className="text-center mt-40">
        <h1 className="font-bold text-white font-size text-5xl">
          Smart pre-accounting
        </h1>
        <p className="text-[#B0B0B0]">
          Introducing our open-source pre-accounting tool. Automate financial
          tasks, stay <br />
          organized, and make informed decisions effortlessly. Experience the
          future of pre-
          <br />
          accounting today!
        </p>
      </div>

      <div className="flex w-full">
        <div className="flex-1 relative">
          <Image
            src={transactions}
            alt="Midday | Transactions"
            width={993}
            height={645}
            style={{
              objectFit: "contain",
            }}
          />
        </div>

        <Image
          src={search}
          alt="Midday | Search"
          width={550}
          height={260}
          className="absolute left-[50%] -ml-[275px] z-10 bottom-32"
        />

        <div className="flex-1 relative">
          <Image
            className="absolute right-0 bottom-0"
            src={overview}
            alt="Midday | Overview"
            width={993}
            height={645}
            style={{
              objectFit: "contain",
            }}
          />
        </div>
      </div>
    </div>
  );
}
