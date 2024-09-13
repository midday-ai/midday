import { Button } from "@midday/ui/button";
import { Card } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { ArrowLeftIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SectionLayout } from "./section-layout";

const problemTextSlides = [
  `PromptMD Urgent Care & Family Practice faced significant financial and operational challenges across its urgent care centers. The key issues included managing high payroll costs, optimizing insurance reimbursements, and ensuring financial stability at multiple locations.`,

  `Payroll accounted for 70% of revenue, well above the industry standard of 50%, putting immense pressure on PromptMD to reduce costs without sacrificing care quality. Compounding the issue, complex insurance reimbursements often led to underpayments or delays, straining cash flow and hampering operational expense management.`,

  `In addition to payroll and reimbursements, PromptMD struggled with optimizing patient acquisition costs, managing supply chain expenses, and maintaining efficient operations at each location to ensure profitability.`,

  `Operational transparency and efficiency were also pressing concerns. PromptMD needed better insights into spending patterns, particularly in high-cost areas like medical supplies, office expenses, professional fees, and bank service charges.`,

  `To address these challenges, PromptMD sought to stress-test its business model, exploring the financial impact of reimbursement failures and identifying cost-cutting measures that extended beyond staff reductions. Integrating and analyzing data from various sources, including EMR systems and financial reports, was essential for making informed decisions to scale the business and secure long-term sustainability.`,
];

const keywordSlides = [
  {
    title: "70% payroll",
    content: `Payroll costs at PromptMD were significantly higher than the industry standard, accounting for 70% of revenue compared to the typical 50%. This put immense pressure on the business to find ways to reduce costs without compromising care quality.`
  },
  {
    title: "Insurance reimbursements",
    content: `The complexities of insurance reimbursements, including underpayments and delayed payments, created significant cash flow issues for PromptMD, impacting their ability to manage operational expenses effectively.`
  },
  {
    title: "Cash flow",
    content: `Cash flow challenges stemmed from various factors, including high payroll costs and delayed insurance reimbursements, making it difficult for PromptMD to manage day-to-day operations and plan for future growth.`
  },
  {
    title: "Supply chain",
    content: `Managing supply chain costs effectively was crucial for maintaining profitability across multiple PromptMD locations, requiring careful oversight and strategic planning.`
  },
  {
    title: "Operational transparency",
    content: `PromptMD needed better insights into spending across various areas, including medical supplies, office supplies, and professional fees, to identify potential cost-saving opportunities.`
  },
  {
    title: "Cost optimization",
    content: `Exploring cost-cutting measures that didn't solely rely on reducing staff hours was a priority for PromptMD, requiring innovative approaches to optimize expenses across the business.`
  },
];

export function SectionCustomerProblem() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isKeywordView, setIsKeywordView] = useState(false);

  const handleNextSlide = () => {
    const slides = isKeywordView ? keywordSlides : problemTextSlides;
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const handlePrevSlide = () => {
    const slides = isKeywordView ? keywordSlides : problemTextSlides;
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const toggleView = () => {
    setIsKeywordView(!isKeywordView);
    setCurrentSlide(0);
  };

  const currentContent = isKeywordView 
    ? keywordSlides[currentSlide] 
    : problemTextSlides[currentSlide];

  return (
    <SectionLayout title="Customer Problem" subtitle="Customer Problem: PromptMD">
        <div className="grid grid-cols-1 gap-8">
          <Card className="bg-zinc-900 text-background p-[5%] rounded-2xl shadow-2xl h-full transition-colors duration-300 relative">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex justify-between my-4">
                <Button
                  onClick={handlePrevSlide}
                  className="px-4 py-2 bg-zinc-800 text-background rounded hover:bg-zinc-700 transition-colors duration-300 font-bold"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </Button>
                <Button
                  onClick={toggleView}
                  className="px-4 py-2 bg-zinc-800 text-background rounded hover:bg-zinc-700 transition-colors duration-300 font-bold"
                >
                  {isKeywordView ? "View Problem Overview" : "View Key Issues"}
                </Button>
                <Button
                  onClick={handleNextSlide}
                  className="px-4 py-2 bg-zinc-800 text-background rounded hover:bg-zinc-700 transition-colors duration-300 font-bold"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="md:p-[5%]">
                {isKeywordView && typeof currentContent === 'object' && 'title' in currentContent && (
                  <h3 className="text-3xl font-bold mb-4">{currentContent.title}</h3>
                )}
                <p className="text-lg md:text-2xl font-semibold leading-relaxed whitespace-pre-line w-full">
                  {isKeywordView && typeof currentContent === 'object' && 'content' in currentContent
                    ? currentContent.content
                    : typeof currentContent === 'string'
                      ? currentContent
                      : null}
                </p>
              </div>
             
             
            </motion.div>
            {/* Add slide number indicator */}
            <div className="absolute bottom-4 right-4 text-sm text-zinc-400">
              Slide {currentSlide + 1} of {isKeywordView ? keywordSlides.length : problemTextSlides.length}
            </div>
          </Card>
        </div>
    </SectionLayout>
  );
}
