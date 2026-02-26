type Props = {
  src?: string | null;
  merchantName: string;
};

export function Logo({ src, merchantName }: Props) {
  if (!src) return null;
  return <img src={src} alt={merchantName} width={112} height={112} />;
}
