import { Button } from "@midday/ui/button";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { ArrowLeftIcon } from "lucide-react";

const stats = [
  { label: "Payroll Reduction", value: "~$110K" },
  { label: "Bi-Weekly Tax Reduction", value: "~$15K" },
  { label: "Variable Cost Savings", value: "~$50K" },
  { label: "Debt Elimination", value: "~$200K" },
  { label: "Operational Margin Increase", value: "56%" },
];

export function SectionStart() {
  return (
    <div className="min-h-screen flex items-center">
      <div className="container">
        <span className="block mb-8 text-lg font-bold">
          Case Study | PromptMD
        </span>
        <div className="mb-8">
          <Icons.Logo width={193} height={193} fill="none" />
        </div>
        <h1 className="text-[110px] md:text-[226px] leading-none mb-4">
          Solomon AI
        </h1>
        <p className="text-2xl md:text-4xl max-w-3xl mb-16">
          How we revolutionized a medical practice with AI-driven efficiency
        </p>
        
        <h2 className="text-3xl font-bold mb-8">In 6 months, we&apos;ve achieved:</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="bg-zinc-900 rounded-xl p-6 shadow-lg border-2 border-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <h3 className="text-4xl  text-white font-bold mb-2">{stat.value}</h3>
              <p className="text-sm text-gray-300">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
