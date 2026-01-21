import perplexityIcon from "./perplexity.png";

export const Logo = () => {
  return (
    <img
      src={(perplexityIcon as { src: string }).src}
      alt="Perplexity"
      width={36}
      height={36}
      className="w-9 h-9 rounded-lg"
    />
  );
};
