export const Logo = ({ id = "gemini" }: { id?: string }) => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      xmlns="http://www.w3.org/2000/svg"
      className="w-9 h-9"
    >
      <defs>
        <linearGradient id={`${id}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1C7EF7" />
          <stop offset="50%" stopColor="#6E44E4" />
          <stop offset="100%" stopColor="#C84FD3" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="#131314" />
      <g transform="translate(6,6)">
        <path
          d="M11.04 19.32Q12 21.51 12 24q0-2.49.93-4.68.96-2.19 2.58-3.81t3.81-2.55Q21.51 12 24 12q-2.49 0-4.68-.93a12.3 12.3 0 0 1-3.81-2.58 12.3 12.3 0 0 1-2.58-3.81Q12 2.49 12 0q0 2.49-.96 4.68-.93 2.19-2.55 3.81a12.3 12.3 0 0 1-3.81 2.58Q2.49 12 0 12q2.49 0 4.68.96 2.19.93 3.81 2.55t2.55 3.81"
          fill={`url(#${id}-grad)`}
        />
      </g>
    </svg>
  );
};
