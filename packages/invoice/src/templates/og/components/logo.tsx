export function Logo({
  src,
  customerName,
}: { src: string; customerName: string }) {
  if (!src) return null;
  return <img src={src} alt={customerName} width={112} height={112} />;
}
