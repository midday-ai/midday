import raycastIcon from "./raycast.png";

export const Logo = () => {
  return (
    <img
      src={(raycastIcon as { src: string }).src}
      alt="Raycast"
      width={36}
      height={36}
      className="w-9 h-9 rounded-lg"
    />
  );
};
