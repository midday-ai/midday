type Props = {
  logo: string;
  customerName: string;
};

export function Logo({ logo, customerName }: Props) {
  return (
    <div style={{ maxWidth: 300 }}>
      <img
        src={logo}
        alt={customerName}
        style={{ height: 80, objectFit: "contain" }}
      />
    </div>
  );
}
