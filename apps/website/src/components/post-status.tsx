type Props = {
  status: string;
};

export function PostStatus({ status }: Props) {
  return (
    <div className="border rounded-full px-3 py-1.5 inline-block text-[11px] mb-4 text-[#878787]">
      {status}
    </div>
  );
}
