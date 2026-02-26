type Props = {
  logo: string;
  merchantName: string;
};

export function Logo({ logo, merchantName }: Props) {
  return (
    <div className="max-w-[300px]">
      <img
        src={logo}
        alt={merchantName}
        style={{
          height: 80,
          objectFit: "contain",
        }}
      />
    </div>
  );
}
