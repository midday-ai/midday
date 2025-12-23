// Icon mapping for homepage components
// Maps Material Icons names to react-icons/md components

import {
  MdPlayArrow,
  MdTrendingDown,
  MdAccountBalanceWallet,
  MdSavings,
  MdOutlineWidgets,
  MdOutlineTrendingUp,
  MdOutlineListAlt,
  MdOutlineInbox,
  MdOutlineTimer,
  MdOutlineDescription,
  MdOutlineScatterPlot,
  MdOutlineFolderZip,
  MdOutlineStar,
  MdOutlineStarHalf,
  MdOutlineReceipt,
  MdOutlineLabel,
  MdOutlineRequestQuote,
  MdOutlineFolder,
  MdCheck,
  MdOutlineFilterList,
  MdOutlineMoreVert,
  MdSearch,
  MdOutlineReceiptLong,
  MdOutlineLink,
  MdOutlineOpenInNew,
  MdOutlineInsights,
  MdIosShare,
} from 'react-icons/md'

export const IconMap = {
  play_arrow: MdPlayArrow,
  trending_up: MdOutlineTrendingUp,
  trending_down: MdTrendingDown,
  account_balance_wallet: MdAccountBalanceWallet,
  savings: MdSavings,
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
  label: MdOutlineLabel,
  request_quote: MdOutlineRequestQuote,
  folder: MdOutlineFolder,
  check: MdCheck,
  filter_list: MdOutlineFilterList,
  more_vert: MdOutlineMoreVert,
  search: MdSearch,
  receipt_long: MdOutlineReceiptLong,
  link: MdOutlineLink,
  open_in_new: MdOutlineOpenInNew,
  arrow_outward: MdOutlineOpenInNew, // Using open_in_new as arrow_outward alternative
  send: MdIosShare, // Using share icon as send alternative
}

export function MaterialIcon({
  name,
  className,
  size,
}: {
  name: keyof typeof IconMap
  className?: string
  size?: number | string
}) {
  const IconComponent = IconMap[name]
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in IconMap`)
    return null
  }
  return <IconComponent className={className} size={size} />
}

