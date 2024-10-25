import { IntegrationCategory, IntegrationConfig, ModelType } from "../../types";
import { Logo } from "./assets/logo";
import { initialize } from "./initialize";

const smallBusinessGoalTemplate: IntegrationConfig = {
  name: "Small Business Goal Template",
  id: "small-business-goal-template",
  category: IntegrationCategory.GoalTemplates,
  active: true,
  logo: Logo,
  short_description: "Set and track goals for your small business.",
  description:
    "This Small Business Goal Template helps you define, track, and achieve your business objectives. It considers various aspects of your business such as revenue, customer acquisition, and operational efficiency to provide a comprehensive goal-setting framework.",
  images: [],
  onInitialize: initialize,
  settings: [
    {
      id: "goal_category",
      label: "Goal Category",
      description: "Select the category of your goal",
      type: "select",
      required: true,
      value: "revenue",
      options: [
        "revenue",
        "customer_acquisition",
        "operational_efficiency",
        "product_development",
        "market_expansion",
      ],
    },
    {
      id: "current_value",
      label: "Current Value",
      description: "Enter the current value for your selected goal category",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "target_value",
      label: "Target Value",
      description: "Enter your target value for the goal",
      type: "number",
      required: true,
      value: 0,
      min: 0,
    },
    {
      id: "timeline",
      label: "Timeline",
      description: "Select the timeline for achieving this goal",
      type: "select",
      required: true,
      value: "quarterly",
      options: ["monthly", "quarterly", "annually", "custom"],
    },
    {
      id: "custom_timeline",
      label: "Custom Timeline (in days)",
      description:
        "If you selected 'custom' timeline, enter the number of days",
      type: "number",
      required: false,
      value: 90,
      min: 1,
    },
  ],
  config: {
    resultFields: [
      { id: "goal_progress", label: "Goal Progress (%)" },
      { id: "remaining_value", label: "Remaining to Achieve" },
      { id: "daily_target", label: "Daily Target" },
      { id: "projected_achievement_date", label: "Projected Achievement Date" },
      { id: "success_probability", label: "Success Probability (%)" },
    ],
  },
  equation: {
    formula: "Goal Progress = (Current Value / Target Value) * 100",
    variables: {
      "Current Value": {
        label: "Current Value",
        description: "The current value for your selected goal category",
        unit: "value",
      },
      "Target Value": {
        label: "Target Value",
        description: "Your target value for the goal",
        unit: "value",
      },
      Timeline: {
        label: "Timeline",
        description: "The timeline for achieving this goal",
        unit: "time",
      },
      "Custom Timeline (in days)": {
        label: "Custom Timeline",
        description: "The custom timeline in days for achieving this goal",
        unit: "days",
      },
    },
    calculate: (variables: {
      [key: string]: number;
    }): { [key: string]: number } => {
      const currentValue = Number(variables["Current Value"] ?? 0);
      const targetValue = Number(variables["Target Value"] ?? 0);
      const timeline = String(variables["Timeline"] ?? "quarterly");
      const customTimeline = Number(
        variables["Custom Timeline (in days)"] ?? 90,
      );

      const goalProgress =
        targetValue !== 0 ? (currentValue / targetValue) * 100 : 0;
      const remainingValue = targetValue - currentValue;

      let timelineInDays;
      switch (timeline) {
        case "monthly":
          timelineInDays = 30;
          break;
        case "quarterly":
          timelineInDays = 90;
          break;
        case "annually":
          timelineInDays = 365;
          break;
        case "custom":
          timelineInDays = customTimeline;
          break;
        default:
          timelineInDays = 90;
      }

      const dailyTarget = remainingValue / timelineInDays;

      const today = new Date();
      const projectedAchievementDate = new Date(
        today.setDate(today.getDate() + timelineInDays),
      );

      // Simple success probability calculation (can be made more sophisticated)
      const successProbability = Math.min(
        100,
        Math.max(0, 100 - (remainingValue / targetValue) * 100),
      );

      return {
        goal_progress: goalProgress,
        remaining_value: remainingValue,
        daily_target: dailyTarget,
        projected_achievement_date: Number(
          projectedAchievementDate.toISOString().split("T")[0],
        ),
        success_probability: successProbability,
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

export default smallBusinessGoalTemplate;
