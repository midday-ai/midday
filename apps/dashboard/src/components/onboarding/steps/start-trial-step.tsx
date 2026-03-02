"use client";

import { motion } from "framer-motion";

type Props = {
  hasBankConnected: boolean;
  hasInboxConnected: boolean;
};

type NextStep = {
  title: string;
  description: string;
};

function getNextSteps(
  hasBankConnected: boolean,
  hasInboxConnected: boolean,
): NextStep[] {
  const steps: NextStep[] = [];

  if (hasBankConnected) {
    steps.push({
      title: "Categorize your first transactions",
      description:
        "Your transactions are syncing now. Categorize a few and Midday learns the rest.",
    });
  } else {
    steps.push({
      title: "Connect your bank account",
      description:
        "Transactions sync automatically and get categorized by AI — no manual entry.",
    });
  }

  if (hasInboxConnected) {
    steps.push({
      title: "Forward a receipt to your inbox",
      description:
        "Midday extracts the details and matches it to the right transaction instantly.",
    });
  } else {
    steps.push({
      title: "Match receipts automatically",
      description:
        "Connect your email or forward receipts — they get matched to transactions for you.",
    });
  }

  steps.push({
    title: "Ask Midday anything",
    description:
      'Try "What\'s my burn rate?" or "Show spending by category" right from your dashboard.',
  });

  steps.push({
    title: "Get insights every Monday",
    description:
      "A weekly AI breakdown of your income, spending, and trends — delivered automatically.",
  });

  return steps;
}

export function StartTrialStep({ hasBankConnected, hasInboxConnected }: Props) {
  const nextSteps = getNextSteps(hasBankConnected, hasInboxConnected);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-lg lg:text-xl font-serif"
        >
          You're ready to go
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-sm text-muted-foreground leading-relaxed"
        >
          Here's what to do first to get the most out of your 14-day trial.
        </motion.p>
      </div>

      <motion.div
        className="space-y-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.3 }}
      >
        {nextSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 + index * 0.08 }}
            className="flex items-start gap-3"
          >
            <div className="relative w-4 h-4 flex items-center justify-center shrink-0 mt-0.5 border border-border bg-secondary">
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                className="relative z-10"
              >
                <path
                  d="M2 5L4.5 7.5L8 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-primary leading-snug">
                {step.title}
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
