/* eslint-disable react/no-unescaped-entities */
import { Card, CardContent, CardHeader } from "@midday/ui/card";
import { Icons } from "@midday/ui/icons";
import { motion } from "framer-motion";
import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SectionLayout } from "./section-layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@midday/ui/table";
import { PieChart, Pie, Cell } from "recharts";

const fadeInUpVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const chartData = [
  { name: "PA-led", revenue: 420, costs: 295.78, profit: 124.22 },
  { name: "MD-led", revenue: 420, costs: 376.81, profit: 43.19 },
];

const breakEvenData = [
  { name: "PA-led", visits: 2.46 },
  { name: "MD-led", visits: 3.14 },
];

const costSavingsData = [
  { category: "Staffing Model Change", savings: 65000 },
  { category: "Optimized Hours", savings: 45000 },
];

const wageExpensesData = [
  { month: "January 2024", expenses: 110320.75 },
  { month: "February 2024", expenses: 145691.81 },
  { month: "March 2024", expenses: 73792.39 },
  { month: "April 2024", expenses: 63057.06 },
  { month: "May 2024", expenses: 64386.53 },
];

const monthlyWageExpensesData = [
  { month: "January 2024", percentage: 14.29 },
  { month: "February 2024", percentage: 18.88 },
  { month: "March 2024", percentage: 9.56 },
  { month: "April 2024", percentage: 8.17 },
  { month: "May 2024", percentage: 8.35 },
  { month: "Cumulative", percentage: 59.27 },
];

const monthlyExpensesData = [
  {
    month: "January 2024",
    ficaMed: 8325.96,
    fui: 562.35,
    sui: 3695.69,
    total: 12583.99,
  },
  {
    month: "February 2024",
    ficaMed: 10949.98,
    fui: 345.34,
    sui: 3621.33,
    total: 14916.65,
  },
  {
    month: "March 2024",
    ficaMed: 5533.44,
    fui: 159.83,
    sui: 2324.79,
    total: 8018.06,
  },
  {
    month: "April 2024",
    ficaMed: 4445.46,
    fui: 135.53,
    sui: 2018.26,
    total: 6599.25,
  },
  {
    month: "May 2024",
    ficaMed: 4625.56,
    fui: 48.56,
    sui: 1000.66,
    total: 5674.78,
  },
];

const totalExpenses = {
  ficaMed: 33880.4,
  fui: 1356.07,
  sui: 12660.73,
  total: 47897.2,
};

const MonthlyExpensesTable = () => (
  <div className="mb-8">
    <CardHeader className="text-2xl font-bold">
      Monthly Payroll Tax Expenses
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Month</TableHead>
            <TableHead>Fica/Med Expense</TableHead>
            <TableHead>FUI Expense</TableHead>
            <TableHead>SUI Expense</TableHead>
            <TableHead>Total Expense</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {monthlyExpensesData.map((row) => (
            <TableRow key={row.month}>
              <TableCell>{row.month}</TableCell>
              <TableCell>${row.ficaMed.toFixed(2)}</TableCell>
              <TableCell>${row.fui.toFixed(2)}</TableCell>
              <TableCell>${row.sui.toFixed(2)}</TableCell>
              <TableCell>${row.total.toFixed(2)}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell className="font-bold">Total</TableCell>
            <TableCell className="font-bold">
              ${totalExpenses.ficaMed.toFixed(2)}
            </TableCell>
            <TableCell className="font-bold">
              ${totalExpenses.fui.toFixed(2)}
            </TableCell>
            <TableCell className="font-bold">
              ${totalExpenses.sui.toFixed(2)}
            </TableCell>
            <TableCell className="font-bold">
              ${totalExpenses.total.toFixed(2)}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </CardContent>
  </div>
);

const expenseCategories = [
  { name: "Fica/Med Expense", amount: 33880.4, percentage: 4.39 },
  { name: "FUI Expense", amount: 1356.07, percentage: 0.18 },
  { name: "SUI Expense", amount: 13799.55, percentage: 1.79 },
  {
    name: "Other Payroll Expense",
    amount: 457248.54 - 33880.4 - 1356.07 - 13799.55,
    percentage: 52.91,
  },
];

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ExpenseCategoriesChart = () => (
  <div className="mb-8">
    <CardHeader className="text-2xl font-bold">Expense Categories</CardHeader>
    <CardContent>
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-1/2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Percentage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseCategories.map((category) => (
                <TableRow key={category.name}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>${category.amount.toFixed(2)}</TableCell>
                  <TableCell>{category.percentage.toFixed(2)}%</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell className="font-bold">Total Payroll Tax</TableCell>
                <TableCell className="font-bold">$49,036.02</TableCell>
                <TableCell className="font-bold">6.35%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">
                  Total Payroll Expense
                </TableCell>
                <TableCell className="font-bold">$457,248.54</TableCell>
                <TableCell className="font-bold">59.27%</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-bold">Grand Total</TableCell>
                <TableCell className="font-bold">$506,284.56</TableCell>
                <TableCell className="font-bold">65.62%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="w-full lg:w-1/2">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={expenseCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={80}
                fill="#8884d8"
                dataKey="amount"
              >
                {expenseCategories.map((entry, index) => (
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
        </div>
      </div>
    </CardContent>
  </div>
);

const ChartSection = ({
  title,
  data,
  dataKeys,
}: { title: string; data: any[]; dataKeys: string[] }) => (
  <div className="mb-8">
    <CardHeader className="text-2xl font-bold">{title}</CardHeader>
    <CardContent className="p-[2%] bg-white rounded-2xl">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="name" stroke="#333" />
          <YAxis stroke="#333" />
          <Tooltip
            contentStyle={{ backgroundColor: "#f5f5f5", color: "#333" }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`rgb(${index * 80}, ${index * 80}, ${index * 80})`}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </div>
);

const CostSavingsChart = () => (
  <div className="mb-8">
    <CardHeader className="text-2xl font-bold">
      Cost Savings Breakdown
    </CardHeader>
    <CardContent className="p-[2%] bg-white rounded-2xl">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={costSavingsData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="category" stroke="#333" />
          <YAxis stroke="#333" />
          <Tooltip
            contentStyle={{ backgroundColor: "#f5f5f5", color: "#333" }}
          />
          <Legend />
          <Bar dataKey="savings" fill="#555" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </div>
);

const WageExpensesChart = () => (
  <div className="mb-8">
    <CardHeader className="text-2xl font-bold">
      Monthly Wage Expenses (2024)
    </CardHeader>
    <CardContent className="p-[2%] bg-white rounded-2xl">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={wageExpensesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="expenses"
            stroke="#000000"
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </CardContent>
  </div>
);

const MonthlyWageExpensesChart = () => (
  <div className="mb-8">
    <CardHeader className="text-2xl font-bold">
      Monthly Wage Expense Reduction (% of Total)
    </CardHeader>
    <CardContent className="p-[2%] bg-white rounded-2xl">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={monthlyWageExpensesData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="percentage" fill="#000000" name="% of Total Expenses" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </div>
);

interface StatItem {
  label: string;
  value: string | number;
  subItems?: { label: string; value: string | number }[];
}

const StatCard = ({ stat }: { stat: StatItem }) => (
  <Card className="mb-4">
    <CardHeader className="text-xl font-bold">{stat.label}</CardHeader>
    <CardContent>
      <p className="text-2xl font-semibold">{stat.value}</p>
      {stat.subItems && (
        <ul className="list-disc pl-5 mt-2">
          {stat.subItems.map((subItem, index) => (
            <li key={index}>
              <span className="font-medium">{subItem.label}:</span>{" "}
              {subItem.value}
            </li>
          ))}
        </ul>
      )}
    </CardContent>
  </Card>
);

const StatsComponent = ({
  title,
  stats,
}: { title: string; stats: StatItem[] }) => (
  <div className="mb-8">
    <h2 className="text-2xl font-bold mb-4">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => (
        <StatCard key={index} stat={stat} />
      ))}
    </div>
  </div>
);

export function SectionPart1PayrollProblem() {
  const wageExpensesStats: StatItem[] = [
    { label: "Cumulative Wage Expenses", value: "$457,248.54" },
    { label: "Average Monthly Wage Expense", value: "$91,449.71" },
    { label: "Peak Expense Month", value: "February 2024" },
    {
      label: "Monthly Wage Expense Growth Rate",
      value: "Varied",
      subItems: [
        { label: "January to February", value: "32.05%" },
        { label: "February to March", value: "-49.37%" },
        { label: "March to April", value: "-14.56%" },
        { label: "April to May", value: "2.11%" },
      ],
    },
  ];

  return (
    <SectionLayout
      title="Payroll Problem Analysis"
      subtitle="PA-led vs MD-led Urgent Care Centers"
    >
      <div className="container mx-auto px-4">
        <div>
          <CardHeader className="text-2xl font-bold">
            Why We Switched the Staffing Model
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our decision to transition from an MD-led to a PA-led staffing
              model was driven by a comprehensive analysis of operational
              efficiency and financial sustainability. The healthcare landscape
              is evolving, and we recognized the need to adapt our urgent care
              centers to meet both patient needs and economic realities.
            </p>
            <p>
              PAs are highly skilled healthcare professionals capable of
              handling a wide range of urgent care cases. By leveraging their
              expertise, we can maintain high-quality care while significantly
              reducing operational costs. This shift allows us to allocate
              resources more efficiently, potentially expanding our services and
              improving accessibility for patients.
            </p>
          </CardContent>
        </div>

        <ChartSection
          title="Revenue, Costs, and Profit Comparison"
          data={chartData}
          dataKeys={["revenue", "costs", "profit"]}
        />

        <div>
          <CardHeader className="text-2xl font-bold">
            Financial Implications of the New Model
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              As illustrated in the chart above, the PA-led model demonstrates a
              marked improvement in profitability. While both models generate
              the same revenue, the PA-led centers operate with lower costs,
              resulting in a significantly higher profit margin. This financial
              advantage allows us to reinvest in our facilities, technology, and
              staff training, ultimately benefiting our patients.
            </p>
            <p>
              It`&apos;`s important to note that this transition doesn`&apos;`t
              compromise the quality of care. PAs work collaboratively with
              supervising physicians, ensuring that complex cases receive
              appropriate attention when needed.
            </p>
          </CardContent>
        </div>

        <ChartSection
          title="Breakeven Visits per Hour"
          data={breakEvenData}
          dataKeys={["visits"]}
        />

        <div>
          <CardHeader className="text-2xl font-bold">
            Operational Efficiency and Scalability
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              The breakeven analysis reveals another crucial advantage of the
              PA-led model. As shown in the chart, PA-led centers require fewer
              visits per hour to cover their operational costs. This lower
              breakeven point translates to reduced financial risk and greater
              resilience during periods of fluctuating patient volumes.
            </p>
            <p>
              Moreover, the PA-led model&apos;s efficiency makes it more
              scalable. We can more easily expand our services to underserved
              areas or extend operating hours, improving healthcare access for
              our communities without incurring prohibitive costs.
            </p>
          </CardContent>
        </div>

        <div>
          <CardHeader className="text-2xl font-bold">
            Significant Cost Savings Achieved
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our strategic changes in staffing model and operating hours have
              resulted in a remarkable $110,000 reduction in annual payroll
              costs. This significant savings was achieved through two primary
              initiatives:
            </p>
            <ol className="list-decimal pl-5 space-y-2 mb-4">
              <li>
                <strong>Transition to PA-led Model ($65,000 savings):</strong>{" "}
                By shifting from an MD-led to a PA-led staffing model,
                we&apos;ve reduced our hourly labor costs while maintaining
                high-quality care. PAs, being highly skilled and more
                cost-effective than MDs for routine urgent care cases, allow us
                to optimize our staffing expenses without compromising patient
                care.
              </li>
              <li>
                <strong>Optimized Operating Hours ($45,000 savings):</strong>{" "}
                Through careful analysis of patient visit patterns, we
                identified peak hours of demand. By adjusting our operating
                hours to align with these peak times, we&apos;ve eliminated
                underutilized hours, reducing unnecessary staffing costs while
                ensuring we&apos;re open when patients need us most.
              </li>
            </ol>
            <p>
              These changes not only result in immediate cost savings but also
              position us for long-term financial sustainability and potential
              expansion of services.
            </p>
          </CardContent>
        </div>

        <CostSavingsChart />

        <div>
          <CardHeader className="text-2xl font-bold">
            Impact of Optimized Hours
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Our data-driven approach to optimizing operating hours has yielded
              several benefits:
            </p>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Increased Efficiency:</strong> By concentrating our
                resources during peak hours, we`&apos;`ve improved our
                patient-to-staff ratio, reducing wait times and enhancing
                overall patient satisfaction.
              </li>
              <li>
                <strong>Staff Satisfaction:</strong> More predictable and busy
                shifts have led to increased job satisfaction among our
                healthcare professionals, potentially reducing turnover.
              </li>
              <li>
                <strong>Resource Allocation:</strong> The cost savings from
                optimized hours allow us to invest in advanced medical equipment
                and staff training, further improving our care quality.
              </li>
              <li>
                <strong>Community Alignment:</strong> Our new hours better serve
                the community`&apos;`s needs, as we`&apos;`re open when demand
                is highest, improving healthcare accessibility.
              </li>
            </ul>
            <p>
              It&apos;s important to note that while we&apos;ve reduced our
              operating hours, we&apos;ve actually increased our capacity to
              serve patients during our busiest times, ensuring that this
              cost-saving measure also translates to improved patient care and
              accessibility.
            </p>
          </CardContent>
        </div>

        <div>
          <CardHeader className="text-2xl font-bold">
            PA-led Model with One Provider and Two Medical Assistants (across
            all centers)
          </CardHeader>
          <CardContent>
            <h3 className="text-xl font-semibold mb-2">
              Why We Did It This Way
            </h3>
            <h4 className="text-lg font-semibold mb-2">
              Strategic Rationale for Adopting a Model with One Provider and Two
              Medical Assistants
            </h4>
            <ul className="list-disc pl-5 space-y-2 mb-4">
              <li>
                <strong>Optimized Labor Costs:</strong> By employing one
                provider alongside two Medical Assistants (MAs), we achieve a
                balanced approach that significantly curtails labor costs while
                maintaining the quality of care. This model is notably more
                cost-effective than traditional MD-led centers, with our new
                configuration showing substantial reductions in hourly labor
                expenses compared to both PA-led ($152.75 per hour) and MD-led
                centers ($226.75 per hour). This streamlined staffing not only
                minimizes payroll expenses but also enhances overall
                profitability.
              </li>
              <li>
                <strong>Increased Net Profitability:</strong> This lean
                operational model directly boosts our net profit per hour. The
                combination of one provider with two MAs reduces the overhead
                associated with higher salaried clinical staff, thereby
                maximizing financial returns relative to the operational costs.
              </li>
              <li>
                <strong>Lower Breakeven Point:</strong> With reduced staffing
                costs, the breakeven point for this model is significantly lower
                than in more traditionally staffed centers. This efficiency
                requires fewer patient visits per hour to cover operational
                costs, reducing financial risk and enhancing the model's
                viability, especially in fluctuating market conditions.
              </li>
              <li>
                <strong>Scalability and Flexibility:</strong> The model's lower
                operational costs afford greater scalability and flexibility,
                particularly beneficial in regions with variable patient demand.
                This adaptability is key for strategic growth, allowing for the
                cost-effective expansion of services and the potential addition
                of similar units across different geographies without
                substantial financial burden.
              </li>
              <li>
                <strong>Efficient Cost Management:</strong> By maintaining a
                minimal yet effective staff composition, our model leverages the
                lowest possible fixed and variable costs. This arrangement not
                only supports financial stability but also provides room for
                further optimization and cost control, enhancing our ability to
                adjust swiftly to changing economic or market conditions.
              </li>
            </ul>
            <p className="mb-4">
              This strategic configuration, focusing on one provider
              supplemented by two MAs, aligns perfectly with our objectives to
              reduce costs while maintaining high standards of patient care and
              operational efficiency.
            </p>

            <h3 className="text-xl font-semibold mb-2">What We Did</h3>
            <h4 className="text-lg font-semibold mb-2">
              Operational Adjustments and Cost Reduction Initiatives at Adam and
              Alex Centers
            </h4>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Strategic Personnel Adjustments:</strong> Dr. Islam
                volunteered as an unpaid provider, sharing responsibilities
                across Edgewater and Fort Lee locations. Dr. Sandra Lee accepted
                a reduction in hourly wages and working hours at Weehawken,
                enhancing our labor cost management.
              </li>
              <li>
                <strong>Workforce Optimization:</strong> We streamlined our
                staff by releasing non-essential scribes, technicians, and
                Medical Assistants (MAs), achieving nearly $100K in payroll
                reductions.
              </li>
              <li>
                <strong>Adapted Operational Hours:</strong> We aligned our hours
                of operation with demographic and demand insights. We reduced
                operational hours at Edgewater and Weehawken, the latter
                catering to a primarily Medicare-dependent demographic, and
                extended hours at Fort Lee to capture a larger patient base.
                Additionally, Edgewater was temporarily closed during the
                lower-demand summer months to further reduce costs.
              </li>
              <li>
                <strong>Vendor Management and Operational Cost Control:</strong>{" "}
                We transitioned from the costly EMR provider Experity, which
                incurred $50K monthly, to the more economical eClinicalWorks,
                significantly reducing our monthly expenditures.
              </li>
              <li>
                <strong>Reduction of Non-Critical Staff and Supplies:</strong>{" "}
                By eliminating all part-time staff and reducing non-critical
                supply expenses, we further streamlined our operational costs.
              </li>
              <li>
                <strong>Debt Management:</strong> We have taken significant
                steps to reduce our debt burden, aligning our financial strategy
                with our overall cost containment and efficiency objectives.
              </li>
            </ul>
          </CardContent>
        </div>

        <WageExpensesChart />

        <MonthlyWageExpensesChart />

        <MonthlyExpensesTable />

        <ExpenseCategoriesChart />

        <StatsComponent
          title="Wage Expenses Analysis (January - May 2024)"
          stats={wageExpensesStats}
        />

        <div>
          <CardHeader className="text-2xl font-bold">Key Findings</CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                Total annual payroll cost reduction of $110,000 through staffing
                model changes and hours optimization.
              </li>
              <li>
                PA-led centers show higher profitability ($124.22/hr vs
                $43.19/hr for MD-led).
              </li>
              <li>
                PA-led centers have a lower breakeven point (2.46 visits/hr vs
                3.14 visits/hr for MD-led).
              </li>
              <li>
                Optimized operating hours have led to increased efficiency and
                better resource allocation.
              </li>
              <li>
                These changes maintain high-quality care while significantly
                reducing operational costs, allowing for potential service
                expansion.
              </li>
            </ul>
          </CardContent>
        </div>
      </div>
    </SectionLayout>
  );
}
