"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { usePlayOnceOnVisible } from "@/hooks/use-play-once-on-visible";
import { MaterialIcon } from "./icon-mapping";

const steps = [
  { id: "create", label: "Invoice created", icon: "doc" },
  { id: "validate", label: "Validating", icon: "check" },
  { id: "convert", label: "Converting to UBL", icon: "code" },
  { id: "send", label: "Sending via Peppol", icon: "send" },
  { id: "delivered", label: "Delivered", icon: "done" },
] as const;

type StepStatus = "pending" | "active" | "done";
type StepIconType = (typeof steps)[number]["icon"];

const COUNTRY_ROW_COUNT = 4;
const countries = [
  { code: "BE", name: "Belgium" },
  { code: "NL", name: "Netherlands" },
  { code: "LU", name: "Luxembourg" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "PT", name: "Portugal" },
  { code: "AT", name: "Austria" },
  { code: "IE", name: "Ireland" },
  { code: "PL", name: "Poland" },
  { code: "NO", name: "Norway" },
  { code: "SE", name: "Sweden" },
  { code: "FI", name: "Finland" },
  { code: "DK", name: "Denmark" },
  { code: "IS", name: "Iceland" },
  { code: "EE", name: "Estonia" },
  { code: "LV", name: "Latvia" },
  { code: "LT", name: "Lithuania" },
  { code: "CZ", name: "Czech Republic" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "HR", name: "Croatia" },
  { code: "RO", name: "Romania" },
  { code: "AU", name: "Australia" },
  { code: "NZ", name: "New Zealand" },
  { code: "SG", name: "Singapore" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "GB", name: "United Kingdom" },
  { code: "GR", name: "Greece" },
  { code: "CH", name: "Switzerland" },
];
const countryRowSize = Math.ceil(countries.length / COUNTRY_ROW_COUNT);
const countryRows = Array.from({ length: COUNTRY_ROW_COUNT }, (_, rowIndex) =>
  countries.slice(rowIndex * countryRowSize, (rowIndex + 1) * countryRowSize),
).filter((row) => row.length > 0);

function StepIcon({
  icon,
  status,
}: {
  icon: StepIconType;
  status: StepStatus;
}) {
  const iconColor =
    status === "active" ? "text-foreground" : "text-muted-foreground/70";
  const frameClass =
    status === "active"
      ? "border-foreground/20 bg-secondary"
      : status === "done"
        ? "border-border bg-secondary/50"
        : "border-border bg-background";

  function renderIcon() {
    if (status === "pending") {
      return null;
    }

    return (
      <span
        className={`inline-flex h-3.5 w-3.5 items-center justify-center ${iconColor}`}
      >
        <MaterialIcon name="check" size={14} />
      </span>
    );
  }

  return (
    <div
      className={`h-7 w-7 rounded-full border flex items-center justify-center ${frameClass}`}
    >
      {renderIcon()}
    </div>
  );
}

export function EInvoiceFlowAnimation({
  onCompleteAction,
}: {
  onCompleteAction?: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [showCountries, setShowCountries] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);

  const [containerRef, shouldPlay] = usePlayOnceOnVisible(() => {}, {
    threshold: 0.3,
  });

  useEffect(() => {
    if (!shouldPlay) return;

    const baseDelay = 250;
    const stepStartDelay = 780;
    const stepDelay = 560;

    const invoiceTimer = setTimeout(() => setShowInvoice(true), baseDelay);
    const stepTimers = steps.map((_, index) =>
      setTimeout(
        () => setCurrentStep(index),
        stepStartDelay + index * stepDelay,
      ),
    );

    const countriesStartDelay = stepStartDelay + steps.length * stepDelay + 420;
    const countriesTimer = setTimeout(() => {
      setShowCountries(true);
    }, countriesStartDelay);

    const completeTimer = setTimeout(() => {
      onCompleteAction?.();
    }, countriesStartDelay + 2800);

    return () => {
      clearTimeout(invoiceTimer);
      stepTimers.forEach(clearTimeout);
      clearTimeout(countriesTimer);
      clearTimeout(completeTimer);
    };
  }, [shouldPlay, onCompleteAction]);

  function getStepStatus(index: number): StepStatus {
    if (index < currentStep) return "done";
    if (index === currentStep) return "active";
    return "pending";
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex flex-col relative overflow-hidden"
    >
      <div className="px-2 md:px-3 pt-3 md:pt-4 pb-2 md:pb-3 border-b border-border">
        <h3 className="text-[13px] md:text-[14px] text-foreground">
          E-invoicing route
        </h3>
      </div>

      <div className="flex-1 px-2 md:px-3 py-3 md:py-4 overflow-hidden flex flex-col gap-3 md:gap-4">
        <AnimatePresence>
          {showInvoice && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="border border-border bg-background p-4 md:p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-medium text-foreground">
                  INV-2026-042
                </div>
                <div className="text-xs text-foreground">EUR 2,450.00</div>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="text-[11px] text-muted-foreground">
                  Acme Industries NV
                </div>
                <div className="text-[11px] text-muted-foreground">
                  BE0859536301
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {currentStep >= 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.24 }}
              className="border border-border bg-background"
            >
              {steps.map((step, index) => {
                const status = getStepStatus(index);
                const isCurrentOrDone = currentStep >= index;
                const isLast = index === steps.length - 1;

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: isCurrentOrDone ? 1 : 0.45, y: 0 }}
                    transition={{ duration: 0.22 }}
                    className="relative flex items-center gap-3 px-4 py-3 border-b border-border last:border-b-0"
                  >
                    <StepIcon icon={step.icon} status={status} />
                    {!isLast && (
                      <motion.div
                        className="absolute left-[29px] mt-[34px] h-5 w-px bg-border"
                        initial={{ opacity: 0.25 }}
                        animate={{ opacity: isCurrentOrDone ? 0.8 : 0.25 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}
                    <div className="min-w-0">
                      <div
                        className={`text-xs leading-none ${
                          status === "active"
                            ? "text-foreground"
                            : "text-muted-foreground/80"
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {showCountries ? (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="space-y-2"
            >
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Peppol network - 30+ countries
              </div>

              <div
                className="relative w-full max-w-full space-y-2 overflow-hidden"
                style={{
                  WebkitMaskImage:
                    "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                  maskImage:
                    "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)",
                }}
              >
                <div
                  className="absolute inset-y-0 -left-12 w-32 z-20 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 48%, hsla(var(--background), 0.96) 68%, hsla(var(--background), 0.72) 82%, hsla(var(--background), 0.38) 92%, transparent 100%)",
                  }}
                />
                <div
                  className="absolute inset-y-0 -right-12 w-32 z-20 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(to left, hsl(var(--background)) 0%, hsl(var(--background)) 48%, hsla(var(--background), 0.96) 68%, hsla(var(--background), 0.72) 82%, hsla(var(--background), 0.38) 92%, transparent 100%)",
                  }}
                />
                {countryRows.map((row, rowIndex) => {
                  const enterX = rowIndex % 2 === 0 ? -12 : 12;
                  const marqueeClass =
                    rowIndex % 2 === 0
                      ? "animate-marquee-left"
                      : "animate-marquee-right";

                  return (
                    <motion.div
                      key={`row-${rowIndex}`}
                      initial={{ opacity: 0, x: enterX }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.42,
                        ease: "easeOut",
                        delay: rowIndex * 0.18,
                      }}
                      className="relative flex w-full max-w-full overflow-hidden"
                      style={{ contain: "paint" }}
                    >
                      <div
                        className={`flex min-w-full ${marqueeClass} will-change-transform`}
                        style={{ animationDuration: `${34 + rowIndex * 4}s` }}
                      >
                        <div className="flex gap-2 shrink-0 pr-2">
                          {row.map((country) => (
                            <div
                              key={country.code}
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-background whitespace-nowrap"
                              title={country.name}
                            >
                              <span className="text-[11px] text-foreground">
                                {country.name}
                              </span>
                            </div>
                          ))}
                        </div>
                        <div
                          className="flex gap-2 shrink-0 pr-2"
                          aria-hidden="true"
                        >
                          {row.map((country) => (
                            <div
                              key={`dup-${country.code}`}
                              className="inline-flex items-center px-3 py-1.5 rounded-full border border-border bg-background whitespace-nowrap"
                              title={country.name}
                            >
                              <span className="text-[11px] text-foreground">
                                {country.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}
