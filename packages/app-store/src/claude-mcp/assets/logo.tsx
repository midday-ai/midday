import claudeIcon from "./claude.png";

export const Logo = () => {
  return (
    <img
      src={(claudeIcon as { src: string }).src}
      alt="Claude"
      width={36}
      height={36}
      className="w-9 h-9 rounded-lg"
    />
  );
};
