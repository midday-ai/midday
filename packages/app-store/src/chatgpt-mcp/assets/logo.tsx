import chatgptIcon from "./chatgpt.png";

export const Logo = () => {
  return (
    <img
      src={(chatgptIcon as { src: string }).src}
      alt="ChatGPT"
      width={36}
      height={36}
      className="w-9 h-9 rounded-lg"
    />
  );
};
