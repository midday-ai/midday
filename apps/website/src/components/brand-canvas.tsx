"use client";

import dynamic from "next/dynamic";
import Image from "next/image";

const ReactHlsPlayer = dynamic(() => import("react-hls-player"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

const assets = [
  <Image
    key="1"
    src={require("public/branding/1.png")}
    width={600}
    alt="keyboard"
  />,
  <Image
    key="2"
    src={require("public/branding/2.png")}
    width={600}
    alt="founders"
  />,
  <Image
    key="3"
    src={require("public/branding/3.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="1"
    src={require("public/branding/11.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="4"
    src={require("public/branding/4.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="5"
    src={require("public/branding/5.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="7"
    src={require("public/branding/7.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="8"
    src={require("public/branding/8.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="9"
    src={require("public/branding/9.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="10"
    src={require("public/branding/10.png")}
    width={600}
    alt="screens"
  />,
  <Image
    key="1"
    src={require("public/branding/1.png")}
    width={600}
    alt="keyboard"
  />,
  <Image
    key="2"
    src={require("public/branding/2.png")}
    width={600}
    alt="founders"
  />,
  <Image
    key="3"
    src={require("public/branding/3.png")}
    width={600}
    alt="screens"
  />,
];

export function BrandCanvas() {
  return (
    <div className="sm:h-screen sm:w-screen">
      <div className="sm:absolute top-0 left-0 right-0 grid grid-cols-0 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:overflow-hidden sm:h-screen">
        {assets.map((asset) => asset)}
      </div>
    </div>
  );
}
