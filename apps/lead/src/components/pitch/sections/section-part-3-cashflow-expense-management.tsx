import { Card, CardContent, CardHeader } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionLayout } from "./section-layout";

const fadeInUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const costReductionData = [
  { category: "Before Optimization", cost: 100 },
  { category: "After Optimization", cost: 66 },
];

const expenseBreakdownData = [
  { name: "Vendors", value: 30 },
  { name: "Rent", value: 25 },
  { name: "Utilities", value: 15 },
  { name: "Employee Salaries", value: 20 },
  { name: "Other", value: 10 },
];

const COLORS = ["#1a1a1a", "#4d4d4d", "#808080", "#b3b3b3", "#e6e6e6"];

const CostReductionChart = () => (
  <div>
    <CardHeader className="text-2xl font-bold">
      Cost Reduction Overview
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={costReductionData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="category" stroke="#333" />
          <YAxis stroke="#333" />
          <Tooltip
            contentStyle={{ backgroundColor: "#f5f5f5", color: "#333" }}
          />
          <Legend />
          <Bar dataKey="cost" fill="#ffffff" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </div>
);

const ExpenseBreakdownChart = () => (
  <div>
    <CardHeader className="text-2xl font-bold">Expense Breakdown</CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={expenseBreakdownData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {expenseBreakdownData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </div>
);

export function SectionPart3CashflowExpenseManagement() {
  return (
    <SectionLayout
      title="Cashflow & Expense Management"
      subtitle="How we reduced costs and improved cashflow"
    >
      <div>
        <div>
          <CardHeader className="text-2xl font-bold">
            Cashflow & Expense Management
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              As we delved into our business’s financial landscape, we
              recognized the need for a more streamlined approach to cashflow
              and expense management. This journey began with a deep dive into
              understanding the flow of money through our operations. Our
              analysis led us to pinpoint the key sources of revenue and assess
              their stability, identify major expense categories that were
              impacting our bottom line, and uncover inefficiencies in our
              financial processes that were quietly eroding our profitability.
            </p>
          </CardContent>
        </div>

        <ExpenseBreakdownChart />

        <div>
          <CardHeader className="text-2xl font-bold">
            Key Areas of Focus
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                Our cost reduction strategy focused on four key areas. First, we
                tackled vendor management by scrutinizing every contract and
                renegotiating terms with our crucial suppliers. This effort
                reduced our vendor costs by an average of 15% and led to the
                implementation of a new vendor evaluation process to ensure
                competitive pricing in the future. Next, we optimized contracts
                by amending suboptimal master service agreements, securing price
                waivers and discounts for long-term commitments, and separating
                orders for contracting and credentialing to reduce overall
                costs.
              </p>

              <p>
                In the realm of technology and service providers, we made
                significant changes. We switched to more cost-effective systems
                for EHR, Billing, and EMR, renegotiated connection costs with IT
                service providers, and migrated to a cloud-based solution, which
                substantially reduced our on-premise infrastructure costs.
              </p>

              <p>
                Lastly, we addressed operational expenses by analyzing and
                optimizing rent and utility costs. We implemented energy-saving
                measures that reduced utility costs by 20% and negotiated more
                favorable lease terms for our facilities. These comprehensive
                efforts across vendor management, contract optimization,
                technology improvements, and operational expense reduction
                resulted in substantial cost savings and improved overall
                financial efficiency.
              </p>
            </div>
          </CardContent>
        </div>

        <CostReductionChart />

        <div>
          <CardHeader className="text-2xl font-bold">
            Results: 34% Decrease in Costs
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our focused efforts on cashflow and expense management yielded
              impressive results:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Overall Cost Reduction:</strong> We achieved a
                remarkable 34% decrease in total operational costs.
              </li>
              <li>
                <strong>Vendor Expenses:</strong> Reduced by 40% through
                contract renegotiations and switching to more cost-effective
                providers.
              </li>
              <li>
                <strong>Technology Costs:</strong> Decreased by 25% by adopting
                more efficient systems and negotiating better rates.
              </li>
              <li>
                <strong>Utility Expenses:</strong> Cut by 20% through
                energy-saving initiatives and usage optimization.
              </li>
              <li>
                <strong>Improved Cashflow:</strong> Our days in accounts
                receivable decreased by 15%, improving overall liquidity.
              </li>
            </ul>
            <p>
              These significant cost reductions not only improved our bottom
              line but also allowed us to reinvest in quality improvements and
              staff development, enhancing our overall service delivery.
            </p>
          </CardContent>
        </div>
      </div>
    </SectionLayout>
  );
}
