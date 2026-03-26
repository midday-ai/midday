import { useState } from "react";

type Props = {
  logo: string;
  customerName: string;
};

export function Logo({ logo, customerName }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) return null;

  return (
    <div className="max-w-[300px]">
      <img
        src={logo}
        alt={customerName}
        className="h-[80px] object-contain"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
