"use client";

// Icon mapping for homepage components
// Maps Material Icons names to react-icons/md components

import {
  MdCheck,
  MdClose,
  MdDeleteOutline,
  MdIosShare,
  MdOutlineAccountBalance,
  MdOutlineAccountBalanceWallet,
  MdOutlineArrowDownward,
  MdOutlineArrowOutward,
  MdOutlineArrowUpward,
  MdOutlineCloud,
  MdOutlineContentCopy,
  MdOutlineCreditCard,
  MdOutlineDescription,
  MdOutlineDownload,
  MdOutlineExpandLess,
  MdOutlineExpandMore,
  MdOutlineFilterList,
  MdOutlineFolder,
  MdOutlineFolderZip,
  MdOutlineInbox,
  MdOutlineInsights,
  MdOutlineLabel,
  MdOutlineLink,
  MdOutlineListAlt,
  MdOutlineMoreVert,
  MdOutlineOpenInNew,
  MdOutlinePictureAsPdf,
  MdOutlineReceipt,
  MdOutlineReceiptLong,
  MdOutlineRequestQuote,
  MdOutlineSavings,
  MdOutlineScatterPlot,
  MdOutlineStar,
  MdOutlineStarHalf,
  MdOutlineSubdirectoryArrowLeft,
  MdOutlineTimer,
  MdOutlineTrendingUp,
  MdOutlineWidgets,
  MdPause,
  MdPlayArrow,
  MdSearch,
  MdTrendingDown,
} from "react-icons/md";

export const IconMap = {
  pause: MdPause,
  play_arrow: MdPlayArrow,
  trending_up: MdOutlineTrendingUp,
  trending_down: MdTrendingDown,
  account_balance_wallet: MdOutlineAccountBalanceWallet,
  account_balance: MdOutlineAccountBalance,
  savings: MdOutlineSavings,
  credit_card: MdOutlineCreditCard,
  widgets: MdOutlineWidgets,
  insights: MdOutlineInsights,
  list_alt: MdOutlineListAlt,
  inbox: MdOutlineInbox,
  timer: MdOutlineTimer,
  description: MdOutlineDescription,
  scatter_plot: MdOutlineScatterPlot,
  folder_zip: MdOutlineFolderZip,
  star: MdOutlineStar,
  star_half: MdOutlineStarHalf,
  receipt: MdOutlineReceipt,
  receipt_long: MdOutlineReceiptLong,
  pdf: MdOutlinePictureAsPdf,
  label: MdOutlineLabel,
  request_quote: MdOutlineRequestQuote,
  folder: MdOutlineFolder,
  check: MdCheck,
  filter_list: MdOutlineFilterList,
  more_vert: MdOutlineMoreVert,
  search: MdSearch,
  link: MdOutlineLink,
  open_in_new: MdOutlineOpenInNew,
  arrow_outward: MdOutlineArrowOutward,
  send: MdIosShare, // Using share icon as send alternative
  expand_less: MdOutlineExpandLess,
  expand_more: MdOutlineExpandMore,
  content_copy: MdOutlineContentCopy,
  download: MdOutlineDownload,
  arrow_upward: MdOutlineArrowUpward,
  arrow_downward: MdOutlineArrowDownward,
  subdirectory_arrow_left: MdOutlineSubdirectoryArrowLeft,
  broken_image: MdOutlineDescription, // Using description as broken_image alternative
  docs: MdOutlineDescription, // Using description as docs alternative
  close: MdClose,
  delete: MdDeleteOutline,
  cloud: MdOutlineCloud,
};

export function MaterialIcon({
  name,
  className,
  size,
}: {
  name: keyof typeof IconMap;
  className?: string;
  size?: number | string;
}) {
  const IconComponent = IconMap[name];
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in IconMap`);
    return null;
  }
  return <IconComponent className={className} size={size} />;
}
