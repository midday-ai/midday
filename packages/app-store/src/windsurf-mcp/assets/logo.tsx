export const Logo = ({ id = "windsurf" }: { id?: string }) => {
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
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="8" fill="#0B1120" />
      <g transform="translate(6,6)">
        <path
          d="M12.784.066a.5.5 0 0 0-.57 0L.214 7.9a.5.5 0 0 0 0 .833l3.025 1.99a.5.5 0 0 0 .57 0l5.2-3.359v7.058l-2.157-1.4a.5.5 0 0 0-.57 0L.214 17.898a.5.5 0 0 0 0 .833l3.025 1.99a.5.5 0 0 0 .57 0L12.5 15V.91zm-.285 14.918l5.2-3.359V4.567l2.158 1.4a.5.5 0 0 0 .57 0l3.025-1.99a.5.5 0 0 0 0-.833L15.359.066l-2.86 1.85V14.984zm2.86 1.95l-2.574 1.664v-6.99l5.2 3.359v7.058l-2.157-1.4a.5.5 0 0 0-.57 0l-6.068 3.924a.5.5 0 0 0 0 .833l3.025 1.99a.5.5 0 0 0 .57 0l8.073-5.22V13.4l2.158 1.4a.5.5 0 0 0 .57 0l3.025-1.99a.5.5 0 0 0 0-.833z"
          fill={`url(#${id}-grad)`}
          transform="scale(0.96) translate(0,0)"
        />
      </g>
    </svg>
  );
};
