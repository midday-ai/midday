import IntegrationConfig, { IntegrationCategory } from "../types";
import image from "./assets/image.png";
import { Logo } from "./assets/logo";
import { onInitialize } from "./initialize";

const slackIntegration: IntegrationConfig = {
  name: "Slack",
  id: "slack",
  category: IntegrationCategory.Assistant,
  active: true,
  logo: Logo,
  short_description: "Integrate Solomon AI into your workspace for intelligent financial insights, automated notifications, and seamless transaction management.",
  description: "Solomon AI integration brings advanced financial intelligence directly into your workflow. This powerful tool provides real-time financial insights, automated notifications, and streamlined transaction management.\n\nWith Solomon AI, you'll receive instant alerts about new transactions, ensuring you're always informed about your financial activities. The integration also allows for effortless attachment uploads, enabling you to link receipts, invoices, and other documents directly to transactions.\n\nBy leveraging AI-driven analysis, Solomon AI offers predictive financial modeling, spending pattern recognition, and personalized financial advice. This not only enhances your financial decision-making but also optimizes your overall financial management process, saving time and improving accuracy in your bookkeeping and financial planning.",
  images: [image],
  onInitialize,
  settings: [
    {
      id: "transaction_notifications",
      label: "Transaction Notifications",
      description: "Receive AI-powered notifications for new transactions, including smart categorization and potential anomaly detection.",
      type: "switch",
      required: false,
      value: true,
    },
    {
      id: "ai_insights",
      label: "AI Insights",
      description: "Enable AI-driven financial insights and recommendations based on your transaction history and spending patterns.",
      type: "switch",
      required: false,
      value: true,
    },
  ],
  config: {}
};

export default slackIntegration;
