import Link from "next/link";

import { cn } from "@/lib/utils";
import { Badge } from "@midday/ui/badge";
import { buttonVariants } from "@midday/ui/button";
import { Dock, DockIcon } from "@midday/ui/magicui/dock";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@midday/ui/tooltip";
import {
    ActivityIcon, DollarSignIcon,
    LayoutIcon,
    LightbulbIcon,
    MessageCircleIcon,
    PercentIcon,
    PieChartIcon, TrendingDownIcon,
    UserPlusIcon
} from "lucide-react";

/**
 * Represents a feature in the financial analytics dock.
 */
interface FinancialFeature {
    /** The URL or route for the feature */
    href: string;
    /** The icon component to display for the feature */
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    /** The display label for the feature */
    label: string;
    /** Indicates if the feature is in beta */
    beta: boolean;
}

/**
 * Contains the data for the financial analytics features.
 */
const FINANCIAL_DATA: {
    /** An array of financial features to display in the dock */
    features: FinancialFeature[];
} = {
    features: [
        { href: "#", icon: PieChartIcon, label: "Asset Allocation", beta: true },
        { href: "#", icon: DollarSignIcon, label: "Cash Flow Analysis", beta: true },
        { href: "#", icon: TrendingDownIcon, label: "Categorization", beta: true },
        { href: "#", icon: ActivityIcon, label: "Expense Metrics", beta: true },
        { href: "#", icon: PercentIcon, label: "Income Breakdown", beta: true },
        { href: "#", icon: LightbulbIcon, label: "Actionable Insights", beta: true },
        { href: "#", icon: MessageCircleIcon, label: "Ask Solomon a Question", beta: true },
        { href: "#", icon: UserPlusIcon, label: "Engage With Members", beta: true },
        { href: "#", icon: LayoutIcon, label: "Focus Mode", beta: true },
    ],
};

/**
 * FinancialAnalyticsDock component
 * 
 * This component renders a dock at the bottom of the screen containing
 * various financial analytics features. Each feature is represented by
 * an icon button with a tooltip.
 * 
 * @returns A React functional component that displays the financial analytics dock
 */
export function FinancialAnalyticsDock(): React.ReactElement {
    return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center pb-4 z-50">
            <TooltipProvider>
                <Dock direction="middle" className="bg-background text-foreground backdrop-blur-sm rounded-full p-2">
                    {FINANCIAL_DATA.features.map((item) => (
                        <DockIcon key={item.label}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        aria-label={item.label}
                                        className={cn(
                                            buttonVariants({ variant: "ghost", size: "icon" }),
                                            "size-12 rounded-full",
                                        )}
                                    >
                                        <item.icon className="size-6 text-foreground" strokeWidth={0.5} />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent
                                    side="top"
                                    className="bg-background text-foreground rounded-2xl py-2 mb-2"
                                    sideOffset={5}
                                >
                                    <div className="flex items-center gap-2">
                                        <p className="text-md">{item.label}</p>
                                        {item.beta && (
                                            <Badge variant="secondary" className="text-xs">
                                                Beta
                                            </Badge>
                                        )}
                                    </div>
                                </TooltipContent>
                            </Tooltip>
                        </DockIcon>
                    ))}
                </Dock>
            </TooltipProvider>
        </div>
    );
}