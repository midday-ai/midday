type Props = {
  customerName?: string;
  logoUrl?: string;
  isValidLogo: boolean;
};

export function Avatar({ logoUrl, isValidLogo, customerName }: Props) {
  if (isValidLogo) {
    return (
      <img
        src={logoUrl}
        alt="Avatar"
        tw="w-10 h-10 object-contain border-[0.5px] border-[#2D2D2D] rounded-full overflow-hidden"
      />
    );
  }

  return (
    <div tw="w-10 h-10 rounded-full border-[0.5px] border-[#2D2D2D] bg-[#1C1C1C] text-[#F2F2F2] flex items-center justify-center">
      {customerName?.[0]}
    </div>
  );
}
