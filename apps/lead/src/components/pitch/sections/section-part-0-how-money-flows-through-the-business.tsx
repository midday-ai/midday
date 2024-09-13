import { AnimatedBeam } from "@/components/magicui/animated-beam";
import { cn } from "@/lib/utils";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import { PackageCheck } from "lucide-react";
import Link from "next/link";
import React, { useRef } from "react";
import { SectionLayout } from "./section-layout";

const moneyFlowSteps = [
    "Patient registers online or at the front desk, providing personal and insurance information.",

    "Insurance and copay amounts are determined through the Waystar system, which verifies the patient's insurance coverage and calculates the expected out-of-pocket costs.",

    "Copay is collected upfront at the time of registration or prior to the appointment, typically via credit card or another accepted payment method.",

    "The patient receives medical services, including consultations, diagnostics, and treatments as required. Charges are recorded in the EMR system, detailing the services rendered and their associated costs.",

    "Once services are completed, the remaining cost is billed to the patient's insurance provider. The billing process involves submitting a detailed claim through the Waystar system, ensuring all procedures and services are coded correctly to maximize reimbursement.",

    "The insurance provider reviews the claim, processes it, and determines the reimbursement amount based on the patient's coverage plan. This process may involve negotiations or adjustments if the initial claim is partially denied or underpaid.",

    "Reimbursement is received from the insurance provider, typically within 30-60 days, and is deposited into the urgent care's designated bank account. This payment may cover the full amount billed or a portion, depending on the patient's insurance plan and any deductibles or co-insurance responsibilities.",

    "If there is any remaining balance after insurance reimbursement, such as uncovered services or deductibles, the urgent care charges the patient's credit card on file. If the patient did not have a credit card on file or if the charge is declined, a bill is sent to the patient for the outstanding amount.",

    "The urgent care reconciles payments and updates their financial records to ensure that all services are paid for and that any outstanding balances are followed up on through collections if necessary.",

    "Financial reports are generated to track cash flow, monitor reimbursement rates, and identify any discrepancies or opportunities to optimize the billing process, ensuring the financial health of the urgent care facility."
];


const Circle = React.forwardRef<
    HTMLDivElement,
    { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
    return (
        <div
            ref={ref}
            className={cn(
                "z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 bg-white p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
                className,
            )}
        >
            {children}
        </div>
    );
});

Circle.displayName = "Circle";

const DetailSection = ({ title, description, details }: { title: string; description: string; details: string }) => {
    return (
        <div className="mb-6">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm mb-2">{description}</p>
            <p className="text-sm">{details}</p>
        </div>
    );
};

export function MoneyFlowDiagram({ className }: { className?: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const patientRef = useRef<HTMLDivElement>(null);
    const insuranceRef = useRef<HTMLDivElement>(null);
    const practiceRef = useRef<HTMLDivElement>(null);
    const waystarRef = useRef<HTMLDivElement>(null);
    const emrRef = useRef<HTMLDivElement>(null);
    const billingRef = useRef<HTMLDivElement>(null);

    return (
        <>
            <div
                className={cn(
                    "relative flex flex-col h-auto w-full items-center justify-center overflow-hidden rounded-2xl p-10 text-white md:shadow-xl",
                    className,
                )}
                ref={containerRef}
            >
                <div className="flex w-full items-center justify-between gap-6 mb-6">
                    <div className="flex flex-col justify-center items-center">
                        <Circle ref={patientRef}>
                            <PackageCheck />
                        </Circle>
                        <span className="mt-2 text-center">Patient</span>
                        <p className="mt-2 text-xs text-center max-w-[150px]">
                            Registers online or at front desk, pays copay, credit card on file for additional billing
                        </p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Circle ref={waystarRef} className="size-16">
                            <PackageCheck />
                        </Circle>
                        <span className="mt-2 text-center">Waystar</span>
                        <p className="mt-2 text-xs text-center max-w-[150px]">
                            Verifies insurance coverage and calculates copay amount
                        </p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Circle ref={emrRef} className="size-16">
                            <PackageCheck />
                        </Circle>
                        <span className="mt-2 text-center">EMR System</span>
                        <p className="mt-2 text-xs text-center max-w-[150px]">
                            Records services provided, prepares data for billing
                        </p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Circle ref={billingRef}>
                            <PackageCheck />
                        </Circle>
                        <span className="mt-2 text-center">Billing</span>
                        <p className="mt-2 text-xs text-center max-w-[150px]">
                            Submits claim to insurance, manages billing process
                        </p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Circle ref={insuranceRef}>
                            <PackageCheck />
                        </Circle>
                        <span className="mt-2 text-center">Insurance</span>
                        <p className="mt-2 text-xs text-center max-w-[150px]">
                            Reviews and processes claims, provides reimbursement
                        </p>
                    </div>
                    <div className="flex flex-col justify-center items-center">
                        <Circle ref={practiceRef}>
                            <PackageCheck />
                        </Circle>
                        <span className="mt-2 text-center">Practice</span>
                        <p className="mt-2 text-xs text-center max-w-[150px]">
                            Receives reimbursement, charges patient for any outstanding balance
                        </p>
                    </div>
                </div>

                {/* Animated Beams */}
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={patientRef}
                    toRef={waystarRef}
                    duration={3}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={waystarRef}
                    toRef={emrRef}
                    duration={3}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={emrRef}
                    toRef={billingRef}
                    duration={3}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={billingRef}
                    toRef={insuranceRef}
                    duration={3}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={insuranceRef}
                    toRef={practiceRef}
                    duration={3}
                />
                <AnimatedBeam
                    containerRef={containerRef}
                    fromRef={billingRef}
                    toRef={practiceRef}
                    duration={3}
                />
            </div>
        </>
    );
}

export function SectionPart0HowMoneyFlowsThroughTheBusiness() {
    return (
        <SectionLayout title="How Money Flows Through The Business" subtitle="Understanding How Money Flows Through The Business">
            <div className="container mx-auto px-4">
                <MoneyFlowDiagram className="mb-16" />
            </div>
        </SectionLayout>
    );
}