import React from "react";

export const Logo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="0.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    className="lucide lucide-component"
  >
    <path d="M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z" />
    <path d="m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z" />
    <path d="M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z" />
    <path d="m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z" />
  </svg>
);
