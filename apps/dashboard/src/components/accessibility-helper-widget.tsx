/**
 * AccessibilityWidget Component
 *
 * This component provides an accessibility helper widget that can be toggled
 * to display various accessibility features.
 *
 * @module AccessibilityWidget
 */

"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@midday/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { CircleIcon, XIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import ChatAccessibilityButton from "./accessibility-button/chat-accessibility-button";
import ExpenseViewAccessibilityButton from "./accessibility-button/expense-view-accessibility-button";
import IncomeViewAccessibilityButton from "./accessibility-button/income-view-accessibility-button";
import OverviewViewAccessibilityButton from "./accessibility-button/overview-view-accessibility-button";
import SubscriptionViewAccessibilityButton from "./accessibility-button/subscription-view-accessibility-button";
import TransactionViewAccessibilityButton from "./accessibility-button/transaction-view-accessibility-button";
import { ProTierDock } from "./dock/dock";
import AdminProductWidget from "./widgets/feature-base/admin-product-widget";
import ChangelogProductWidget from "./widgets/feature-base/changelog-product-widget";
import FeedbackProductWidget from "./widgets/feature-base/feedback-product-widget";

/**
 * Props for the AccessibilityWidget component.
 *
 * @typedef {Object} AccessibilityWidgetProps
 * @property {string} email - The email of the current user.
 * @property {string} name - The name of the current user.
 * @property {string} id - The unique identifier of the current user.
 * @property {string} profilePicture - The URL of the user's profile picture.
 */
export interface AccessibilityWidgetProps {
  email: string;
  name: string;
  id: string;
  profilePicture: string;
}

/**
 * AccessibilityWidget Component
 *
 * This component renders a toggleable widget that provides accessibility features.
 * It includes a chat button and a product updates section.
 *
 * @param {AccessibilityWidgetProps} props - The props for the AccessibilityWidget component.
 * @returns {React.ReactElement} The rendered AccessibilityWidget component.
 */
export const AccessibilityWidget: React.FC<AccessibilityWidgetProps> = ({
  email,
  name,
  id,
  profilePicture,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  /**
   * Toggles the open/closed state of the widget.
   */
  const toggleWidget = useCallback(() => {
    setIsOpen((prevState) => !prevState);
  }, []);

  /**
   * Renders the toggle button for the widget.
   *
   * @returns {React.ReactElement} The rendered toggle button.
   */
  const renderToggleButton = () => (
    <button
      className="fixed bottom-4 left-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg z-50"
      onClick={toggleWidget}
    >
      {isOpen ? (
        <XIcon className="w-6 h-6" strokeWidth={0.5} />
      ) : (
        <CircleIcon className="w-6 h-6" strokeWidth={0.5} />
      )}
      <span className="sr-only">{isOpen ? "Close Menu" : "Open Menu"}</span>
    </button>
  );

  /**
   * Renders the content of the widget when it's open.
   *
   * @returns {React.ReactElement} The rendered widget content.
   */
  const renderWidgetContent = () => (
    <div className="fixed inset-0 z-50 backdrop-blur-sm">
      <Card className="fixed bottom-20 left-4 p-6 md:min-w-[400px] max-w-[120vw] md:min-h-[700px] rounded-3xl bg-background text-foreground shadow-xl border-t border-background/3">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={toggleWidget}>
            <XIcon className="h-6 w-6" strokeWidth={0.5} />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <Tabs
          defaultValue="quick-access"
          className="w-full flex flex-col gap-4"
        >
          <TabsList className="flex w-fit">
            <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
            {/* <TabsTrigger value="product">Product</TabsTrigger> */}
          </TabsList>
          <TabsContent value="quick-access">
            <div className="flex flex-col gap-4 items-start md:h-[400px] overflow-y-auto scrollbar-hide">
              {renderQuickAccessButtons()}
            </div>
          </TabsContent>
          {/* <TabsContent value="product">
            <div className="flex flex-col gap-4 items-start md:h-[400px] overflow-y-auto scrollbar-hide">
              {renderProductButtons()}
            </div>
          </TabsContent> */}
        </Tabs>
      </Card>
    </div>
  );

  /**
   * Renders the quick access buttons.
   *
   * @returns {React.ReactElement} The rendered quick access buttons.
   */
  const renderQuickAccessButtons = () => (
    <>
      {renderAccessButton(
        "",
        <ChatAccessibilityButton className="py-2" title="Ask Solomon" />,
      )}
      {renderAccessButton(
        "",
        <IncomeViewAccessibilityButton className="py-2" title={"Income"} />,
      )}
      {renderAccessButton(
        "",
        <ExpenseViewAccessibilityButton className="py-2" title={"Expense"} />,
      )}
      {renderAccessButton(
        "",
        <SubscriptionViewAccessibilityButton
          className="py-2"
          title="Subscriptions"
        />,
      )}
      {renderAccessButton(
        "",
        <TransactionViewAccessibilityButton
          className="py-2"
          title="Transactions"
        />,
      )}
      {renderAccessButton(
        "",
        <OverviewViewAccessibilityButton className="py-2" title="Overview" />,
      )}
    </>
  );

  /**
   * Renders the product buttons.
   *
   * @returns {React.ReactElement} The rendered product buttons.
   */
  const renderProductButtons = () => (
    <>
      {renderProductButton(
        "Product Updates",
        <AdminProductWidget
          organization="solomonai"
          theme="light"
          fullscreenPopup={false}
          locale="en"
          usersName="Solomon"
          className="py-2"
          placement="right"
          email={email}
          name={name}
          id={id}
          profilePicture={profilePicture}
        />,
      )}
      {renderProductButton(
        "Feedback",
        <FeedbackProductWidget
          organization="solomonai"
          theme="light"
          locale="en"
          usersName="Solomon"
          className="py-2"
          placement="right"
          email={email}
          name={name}
          id={id}
          profilePicture={profilePicture}
        />,
      )}
      {renderProductButton(
        "Changelog",
        <ChangelogProductWidget
          organization="solomonai"
          theme="light"
          locale="en"
          usersName="Solomon"
          className="py-2"
          email={email}
          name={name}
          id={id}
          profilePicture={profilePicture}
          fullscreenPopup={true}
        />,
      )}
    </>
  );

  /**
   * Renders an access button.
   *
   * @param {string} label - The label for the button.
   * @param {React.ReactNode} icon - The icon for the button.
   * @returns {React.ReactElement} The rendered access button.
   */
  const renderAccessButton = (label: string, icon: React.ReactNode) => (
    <Button
      variant="ghost"
      className="flex flex-1 items-center gap-2 border-0 w-full justify-start"
    >
      {icon}
    </Button>
  );

  /**
   * Renders a product button.
   *
   * @param {string} label - The label for the button.
   * @param {React.ReactNode} widget - The widget for the button.
   * @returns {React.ReactElement} The rendered product button.
   */
  const renderProductButton = (label: string, widget: React.ReactNode) => (
    <div className="flex flex-1 items-center gap-2 border-0 w-full justify-start">
      <div className="flex items-center gap-2">
        {widget}
        <span className="text-lg">{label}</span>
      </div>
    </div>
  );

  return (
    <>
      {renderToggleButton()}
      {isOpen && renderWidgetContent()}
    </>
  );
};

export default AccessibilityWidget;
