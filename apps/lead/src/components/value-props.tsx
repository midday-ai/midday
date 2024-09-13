/* eslint-disable @next/next/no-img-element */
import { ChartBarIcon, CheckIcon, ListBulletIcon } from "@heroicons/react/16/solid";
import { CubeIcon } from "@heroicons/react/20/solid";
import {
    BellIcon,
    CalendarIcon,
    FileTextIcon,
    GlobeIcon,
    InputIcon,
} from "@radix-ui/react-icons";
import { ArrowRightIcon, ArrowRightToLine } from "lucide-react";
import Link from "next/link";
import { BentoCard, BentoGrid } from "./magicui/bento-grid";


const features = [
    {
        Icon: FileTextIcon,
        name: "PDF Guide",
        description: "PDF Guide offering best practices for invoicing, expense tracking, cashflow, cost management, and more",
        href: "https://cal.com/solomonai/15min",
        cta: "Contact us",
        background: <img className="absolute -right-20 -top-20 opacity-60" />,
        className: "lg:row-start-1 lg:row-end-4 lg:col-start-2 lg:col-end-3",
    },
    {
        Icon: ChartBarIcon,
        name: "Business Health Audit",
        description: "Free in-depth Business Health Audit to outline financial leaks in your business operations",
        href: "/audit",
        cta: "Learn more",
        background: <img className="absolute -right-20 -top-20 opacity-60" />,
        className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
    },
    {
        Icon: ListBulletIcon,
        name: "Personalized Checklist",
        description: "Free personalized checklist based on your business's critical needs to ensure you're on track",
        href: "/checklist",
        cta: "Learn more",
        background: <img className="absolute -right-20 -top-20 opacity-60" />,
        className: "lg:col-start-1 lg:col-end-2 lg:row-start-3 lg:row-end-4",
    },
    {
        Icon: CalendarIcon,
        name: "10 Free Meetings With Us",
        description: "In-depth analysis of your business operations and recommendations for improvement with our team.",
        href: "https://cal.com/solomonai/15min",
        cta: "Schedule a meeting today",
        background: <img className="absolute -right-20 -top-20 opacity-60" />,
        className: "lg:col-start-3 lg:col-end-3 lg:row-start-1 lg:row-end-2",
    },
    {
        Icon: CubeIcon,
        name: "Solomon AI Platform",
        description:
            "Access to our AI platform to streamline your business operations",
        href: "https://solomon-ai.app",
        cta: "Get Started",
        background: <img className="absolute -right-20 -top-20 opacity-60" />,
        className: "lg:col-start-3 lg:col-end-3 lg:row-start-2 lg:row-end-4",
    },
];

export async function ValueProps() {
    return (
        <div className="flex flex-col items-center justify-center gap-8">
            <p className="text-white text-center text-lg">
                Reference some of our work <Link href="/pitch">
                    <ArrowRightIcon className="inline-block" />
                </Link>
            </p>
            <p className='text-white text-center text-4xl font-bold'>
                For one week, enjoy the following at no cost
            </p>
            <BentoGrid className="lg:grid-rows-3">
                {features.map((feature) => (
                    <BentoCard key={feature.name} {...feature} />
                ))}
            </BentoGrid>
        </div>
        
    );
}
