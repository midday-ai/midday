import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const operationalEfficiencyGoalTemplate: IntegrationConfig = {
  name: "Operational Efficiency Goal Template",
  id: "operational-efficiency-goal-template",
  category: IntegrationCategory.GoalTemplates,
  active: true,
  logo: Logo,
  short_description:
    "Set and track operational efficiency goals for your business.",
  description:
    "This Operational Efficiency Goal Template helps you define, track, and achieve objectives related to streamlining business processes and reducing costs. It considers metrics such as Operating Expenses Ratio, Employee Productivity, Inventory Turnover, Cash Conversion Cycle, and Process Cycle Efficiency.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "total_revenue",
      label: "Total Revenue",
      description: "Enter your total revenue for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "operating_expenses",
      label: "Operating Expenses",
      description: "Enter your total operating expenses for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "number_of_employees",
      label: "Number of Employees",
      description: "Enter the total number of full-time equivalent employees",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "cogs",
      label: "Cost of Goods Sold",
      description: "Enter your total cost of goods sold for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "average_inventory",
      label: "Average Inventory Value",
      description: "Enter the average value of your inventory for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "accounts_receivable",
      label: "Accounts Receivable",
      description: "Enter your average accounts receivable for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "accounts_payable",
      label: "Accounts Payable",
      description: "Enter your average accounts payable for the period",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "total_process_time",
      label: "Total Process Time (hours)",
      description: "Enter the total time spent on core business processes",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "value_added_time",
      label: "Value-Added Time (hours)",
      description:
        "Enter the time spent on activities that directly add value to the product or service",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_operating_expense_ratio",
      label: "Target Operating Expense Ratio (%)",
      description: "Enter your target operating expense ratio",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_employee_productivity",
      label: "Target Employee Productivity",
      description: "Enter your target revenue per employee",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_inventory_turnover",
      label: "Target Inventory Turnover",
      description: "Enter your target inventory turnover ratio",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_cash_conversion_cycle",
      label: "Target Cash Conversion Cycle (days)",
      description: "Enter your target cash conversion cycle in days",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_process_cycle_efficiency",
      label: "Target Process Cycle Efficiency (%)",
      description: "Enter your target process cycle efficiency",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
  ],
  config: {
    resultFields: [
      {
        id: "current_operating_expense_ratio",
        label: "Current Operating Expense Ratio (%)",
      },
      {
        id: "current_employee_productivity",
        label: "Current Employee Productivity",
      },
      { id: "current_inventory_turnover", label: "Current Inventory Turnover" },
      {
        id: "current_cash_conversion_cycle",
        label: "Current Cash Conversion Cycle (days)",
      },
      {
        id: "current_process_cycle_efficiency",
        label: "Current Process Cycle Efficiency (%)",
      },
      {
        id: "operating_expense_ratio_gap",
        label: "Operating Expense Ratio Gap (%)",
      },
      { id: "employee_productivity_gap", label: "Employee Productivity Gap" },
      { id: "inventory_turnover_gap", label: "Inventory Turnover Gap" },
      {
        id: "cash_conversion_cycle_improvement",
        label: "Cash Conversion Cycle Improvement (days)",
      },
      {
        id: "process_cycle_efficiency_gap",
        label: "Process Cycle Efficiency Gap (%)",
      },
    ],
  },
  equation: {
    formula:
      "Operational Efficiency Score = f(Operating Expense Ratio, Employee Productivity, Inventory Turnover, Cash Conversion Cycle, Process Cycle Efficiency)",
    variables: {
      "Total Revenue": {
        label: "Total Revenue",
        description: "Total revenue of the business for the period",
        unit: "currency",
      },
      "Operating Expenses": {
        label: "Operating Expenses",
        description: "Total operating expenses for the period",
        unit: "currency",
      },
      "Number of Employees": {
        label: "Number of Employees",
        description: "Total number of full-time equivalent employees",
        unit: "employees",
      },
      COGS: {
        label: "Cost of Goods Sold",
        description: "Total cost of goods sold for the period",
        unit: "currency",
      },
      "Average Inventory": {
        label: "Average Inventory Value",
        description: "Average value of inventory for the period",
        unit: "currency",
      },
      "Accounts Receivable": {
        label: "Accounts Receivable",
        description: "Average accounts receivable for the period",
        unit: "currency",
      },
      "Accounts Payable": {
        label: "Accounts Payable",
        description: "Average accounts payable for the period",
        unit: "currency",
      },
      "Total Process Time": {
        label: "Total Process Time",
        description: "Total time spent on core business processes",
        unit: "hours",
      },
      "Value-Added Time": {
        label: "Value-Added Time",
        description: "Time spent on activities that directly add value",
        unit: "hours",
      },
    },
    calculate: (variables) => {
      const totalRevenue = variables["Total Revenue"] ?? 0;
      const operatingExpenses = variables["Operating Expenses"] ?? 0;
      const numberOfEmployees = variables["Number of Employees"] ?? 0;
      const cogs = variables["COGS"] ?? 0;
      const averageInventory = variables["Average Inventory Value"] ?? 0;
      const accountsReceivable = variables["Accounts Receivable"] ?? 0;
      const accountsPayable = variables["Accounts Payable"] ?? 0;
      const totalProcessTime = variables["Total Process Time (hours)"] ?? 0;
      const valueAddedTime = variables["Value-Added Time (hours)"] ?? 0;
      const targetOperatingExpenseRatio =
        variables["Target Operating Expense Ratio (%)"] ?? 0;
      const targetEmployeeProductivity =
        variables["Target Employee Productivity"] ?? 0;
      const targetInventoryTurnover =
        variables["Target Inventory Turnover"] ?? 0;
      const targetCashConversionCycle =
        variables["Target Cash Conversion Cycle (days)"] ?? 0;
      const targetProcessCycleEfficiency =
        variables["Target Process Cycle Efficiency (%)"] ?? 0;

      // Calculate current metrics
      const currentOperatingExpenseRatio =
        totalRevenue !== 0 ? (operatingExpenses / totalRevenue) * 100 : 0;
      const currentEmployeeProductivity =
        numberOfEmployees !== 0 ? totalRevenue / numberOfEmployees : 0;
      const currentInventoryTurnover =
        averageInventory !== 0 ? cogs / averageInventory : 0;

      const daysInventoryOutstanding =
        currentInventoryTurnover !== 0 ? 365 / currentInventoryTurnover : 0;
      const daysSalesOutstanding =
        totalRevenue !== 0 ? (accountsReceivable / totalRevenue) * 365 : 0;
      const daysPayablesOutstanding =
        cogs !== 0 ? (accountsPayable / cogs) * 365 : 0;
      const currentCashConversionCycle =
        daysInventoryOutstanding +
        daysSalesOutstanding -
        daysPayablesOutstanding;

      const currentProcessCycleEfficiency =
        totalProcessTime !== 0 ? (valueAddedTime / totalProcessTime) * 100 : 0;

      // Calculate gaps and improvements
      const operatingExpenseRatioGap =
        targetOperatingExpenseRatio - currentOperatingExpenseRatio;
      const employeeProductivityGap =
        targetEmployeeProductivity - currentEmployeeProductivity;
      const inventoryTurnoverGap =
        targetInventoryTurnover - currentInventoryTurnover;
      const cashConversionCycleImprovement =
        currentCashConversionCycle - targetCashConversionCycle;
      const processCycleEfficiencyGap =
        targetProcessCycleEfficiency - currentProcessCycleEfficiency;

      return {
        current_operating_expense_ratio: currentOperatingExpenseRatio,
        current_employee_productivity: currentEmployeeProductivity,
        current_inventory_turnover: currentInventoryTurnover,
        current_cash_conversion_cycle: currentCashConversionCycle,
        current_process_cycle_efficiency: currentProcessCycleEfficiency,
        operating_expense_ratio_gap: operatingExpenseRatioGap,
        employee_productivity_gap: employeeProductivityGap,
        inventory_turnover_gap: inventoryTurnoverGap,
        cash_conversion_cycle_improvement: cashConversionCycleImprovement,
        process_cycle_efficiency_gap: processCycleEfficiencyGap,
      };
    },
  },
  model_type: ModelType.FinancialModel,
  api_version: "v1.0.0",
  is_public: false,
  tags: ["analysis", "financial", "projection"],
  integration_type: undefined,
  webhook_url: "https://gateway.solomon-ai-platform.com",
  supported_features: undefined,
  last_sync_at: new Date().toISOString(),
  sync_status: undefined,
  auth_method: "none",
};

export default operationalEfficiencyGoalTemplate;
