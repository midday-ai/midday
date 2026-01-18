import cursorIcon from "./cursor.png";

export const Logo = () => {
  return (
    <img
      src={(cursorIcon as { src: string }).src}
      alt="Cursor"
      width={36}
      height={36}
      className="w-9 h-9 rounded-lg"
    />
  );
};
