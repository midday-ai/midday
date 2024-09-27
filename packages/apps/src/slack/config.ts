import image from "./assets/image.png";
import { Logo } from "./assets/logo";
import { onInitialize } from "./initialize";

export default {
  name: "Slack",
  id: "slack",
  category: "Assistant",
  active: true,
  logo: Logo,
  short_description:
    "Integrating with Slack enables you to use Midday Assistant right from your Slack workspace, you will also get notifications when you have new transactions and more.",
  description:
    "Integrating Midday with Slack brings powerful financial management capabilities directly into your team's communication hub. With this integration, you can seamlessly interact with Midday Assistant without leaving your Slack workspace, enabling quick access to financial insights and actions. \n\nYou'll receive timely notifications about new transactions, ensuring you're always up-to-date with your financial activities. Moreover, this integration streamlines your workflow by allowing you to upload attachments for transactions directly from Slack. \n\nWhether it's receipts, invoices, or any other relevant documents, you can easily attach them to your transactions without switching between multiple applications. This feature not only saves time but also ensures that all your financial documentation is properly organized and linked to the correct transactions, enhancing your overall bookkeeping efficiency.",
  images: [image],
  onInitialize,
  settings: [
    {
      id: "notifications",
      label: "Notifications",
      type: "switch",
      required: false,
      default: true,
    },
  ],
};
