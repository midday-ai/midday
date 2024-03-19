export function PostStatus({ status }) {
  switch (status) {
    case "Update":
      return (
        <div className="border border-[#DFB31D] rounded-md px-2 py-1 inline-block text-[#DFB31D] text-[10px] font-medium mb-4">
          Updates
        </div>
      );

    default:
      return null;
  }
}
