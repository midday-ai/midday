"use client";

import { FinancialUserProfile, MelodyFinancialContext } from "client-typescript-sdk";
import { Card } from "../card";
import { LinkedAccountCard } from "../cards/linked-account-card/linked-account-card";

interface FinancialPortalOverviewProps {
    financialProfile: FinancialUserProfile;
    financialContext: MelodyFinancialContext;
}

export const FinancialPortalOverview: React.FC<FinancialPortalOverviewProps> = ({ financialProfile, financialContext }) => {

    const linkedInstitutions =
        financialProfile.link !== undefined ? financialProfile.link : [];

    // get the linked institution names
    const linkedInstitutionNames = linkedInstitutions.map((link) => {
        return link.institutionName !== undefined
            ? " " + link.institutionName.toLowerCase()
            : "";
    });

    // get all bank accounts from link
    const bankAccounts = linkedInstitutions
        ? linkedInstitutions
            .filter((link) => link.bankAccounts !== undefined)
            .map((link) => link.bankAccounts)
            .flat()
        : [];

    // get all credit accounts from link
    const creditAccounts = linkedInstitutions
        ? linkedInstitutions
            .filter((link) => link.creditAccounts !== undefined)
            .map((link) => link.creditAccounts)
            .flat()
        : [];

    // get all investment accounts from link
    const investmentAccounts = linkedInstitutions
        ? linkedInstitutions
            .filter((link) => link.investmentAccounts !== undefined)
            .map((link) => link.investmentAccounts)
            .flat()
        : [];

    // get all mortgage accounts from link
    const mortgageLoanAccounts = linkedInstitutions
        ? linkedInstitutions
            .filter((link) => link.mortgageAccounts !== undefined)
            .map((link) => link.mortgageAccounts)
            .flat()
        : [];

    // get all student loan accounts from link
    const studentLoanAccounts = linkedInstitutions
        ? linkedInstitutions
            .filter((link) => link.studentLoanAccounts !== undefined)
            .map((link) => link.studentLoanAccounts)
            .flat()
        : [];

    const numConnectedAccounts =
        bankAccounts.length +
        creditAccounts.length +
        investmentAccounts.length +
        mortgageLoanAccounts.length +
        studentLoanAccounts.length;

    const stats = [
        {
            id: 1,
            name: "Connected Accounts",
            value: numConnectedAccounts,
        },
        {
            id: 2,
            name: "Number Of Linked Institutions",
            value: `${linkedInstitutions.length}`,
        },
        {
            id: 3,
            name: "Linked Institutions",
            value: `${linkedInstitutionNames}`,
        },
    ];

    return (
        <div className="bg-background text-foreground">
            <div className="w-full p-[3%]">
                <div className="mx-auto w-full">
                    <div className="flex flex-row justify-between">
                        <p className="text-base font-semibold leading-7 text-blue-600 md:pt-[10%]">
                            Solomon AI
                        </p>
                    </div>

                    <h2 className="mt-2 text-4xl font-bold tracking-tight text-black sm:text-6xl">
                        Financial Portal
                        <span className="font-base ml-4 text-sm">
                            {" "}
                            {linkedInstitutions !== undefined
                                ? linkedInstitutions.length
                                : 0}{" "}
                            Linked Accounts
                        </span>
                    </h2>
                    <p className="mt-6 text-lg leading-8 text-gray-600">
                        Your Premier Gateway to Wealth Mastery and Financial Liberation.
                    </p>
                    <div>
                        <h2 className="py-5 text-2xl font-bold tracking-tight">
                            Overview{" "}
                            <span className="ml-1 text-xs">
                                {" "}
                                {linkedInstitutions.length} Linked Accounts
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 gap-4 pt-3 md:grid-cols-2 lg:grid-cols-2">
                            {linkedInstitutions.map((link, idx) => (
                                <LinkedAccountCard link={link} key={idx} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <dl className="mt-16 grid grid-cols-1 gap-0.5 overflow-hidden rounded-2xl text-center sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat) => (
                    <div key={stat.id} className="flex flex-col bg-gray-400/5 p-8">
                        <dt className="text-sm font-semibold leading-6 text-gray-600">
                            {stat.name}
                        </dt>
                        <dd className="order-first text-3xl font-semibold tracking-tight text-gray-900">
                            {stat.value}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};
