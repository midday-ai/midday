type Props = {
  logo: string;
  customerName: string;
};

export function Logo({ logo, customerName }: Props) {
  return (
    <img
      src={logo}
      alt={customerName}
      style={{
        height: 80,
        objectFit: "contain",
      }}
    />
  );
}
