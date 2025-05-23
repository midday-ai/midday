type Props = {
  src?: string | null;
  customerName: string;
};

export function Logo({ src, customerName }: Props) {
  if (!src) return null;
  return <img src={src} alt={customerName} width={112} height={112} />;
}
