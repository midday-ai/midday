import { useState } from "react";

type Props = {
  logo: string;
  customerName: string;
};

export function Logo({ logo, customerName }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div style={{ maxWidth: 300 }}>
      <img
        src={logo}
        alt={customerName}
        style={{ height: 80, objectFit: "contain" }}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
