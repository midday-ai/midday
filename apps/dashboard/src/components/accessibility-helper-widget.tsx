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
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@midday/ui/tabs";
import { CircleIcon, XIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import ChatAccessibilityButton from "./accessibility-button/chat-accessibility-button";
import ExpenseViewAccessibilityButton from "./accessibility-button/expense-view-accessibility-button";
import IncomeViewAccessibilityButton from "./accessibility-button/income-view-accessibility-button";
import OverviewViewAccessibilityButton from "./accessibility-button/overview-view-accessibility-button";
import SubscriptionViewAccessibilityButton from "./accessibility-button/subscription-view-accessibility-button";
import TransactionViewAccessibilityButton from "./accessibility-button/transaction-view-accessibility-button";
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
      className="fixed bottom-0 m-4 hidden sm:block left-20 w-12 h-12 rounded-full bg-primary text-primary-foreground items-center justify-center shadow-lg"
      onClick={toggleWidget}
    >
      {isOpen ? (
        <XIcon className="w-6 h-6" />
      ) : (
        <CircleIcon className="w-6 h-6" />
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
      <Card className="fixed bottom-20 left-20 p-6 shadow-lg md:min-w-[300px]">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={toggleWidget}>
            <XIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <Tabs defaultValue="quick-access" className="w-full flex flex-col gap-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick-access">Quick Access</TabsTrigger>
            <TabsTrigger value="product">Product</TabsTrigger>
            <TabsTrigger value="pro-tier">Pro Tier</TabsTrigger>
          </TabsList>
          <TabsContent value="quick-access">
            <div className="flex flex-col gap-4 items-start md:h-[400px] overflow-y-auto scrollbar-hide">
              {renderQuickAccessButtons()}
            </div>
          </TabsContent>
          <TabsContent value="product">
            <div className="flex flex-col gap-4 items-start md:h-[400px] overflow-y-auto scrollbar-hide">
              {renderProductButtons()}
            </div>
          </TabsContent>
          <TabsContent value="pro-tier">
            <div className="flex flex-col items-center justify-center gap-4 md:h-[400px] overflow-y-auto scrollbar-hide">
              <div className="text-lg font-bold">Private Beta</div>
              <div className="text-sm text-muted-foreground">
                You are in the private beta of Pro Tier.
              </div>
            </div>
          </TabsContent>
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
      {renderAccessButton("Ask Solomon", <ChatAccessibilityButton className="m-3" />)}
      {renderAccessButton("Income", <IncomeViewAccessibilityButton className="m-3" />)}
      {renderAccessButton("Expenses", <ExpenseViewAccessibilityButton className="m-3" />)}
      {renderAccessButton("Subscriptions", <SubscriptionViewAccessibilityButton className="m-3" />)}
      {renderAccessButton("Transactions", <TransactionViewAccessibilityButton className="m-3" />)}
      {renderAccessButton("Overview", <OverviewViewAccessibilityButton className="m-3" />)}
    </>
  );

  /**
   * Renders the product buttons.
   *
   * @returns {React.ReactElement} The rendered product buttons.
   */
  const renderProductButtons = () => (
    <>
      {renderProductButton("Product Updates", 
        <AdminProductWidget
          organization="solomonai"
          theme="light"
          fullscreenPopup={false}
          locale="en"
          usersName="Solomon"
          className="m-3"
          placement="right"
          email={email}
          name={name}
          id={id}
          profilePicture={profilePicture}
        />
      )}
      {renderProductButton("Feedback", 
        <FeedbackProductWidget
          organization="solomonai"
          theme="light"
          locale="en"
          usersName="Solomon"
          className="m-3"
          placement="right"
          email={email}
          name={name}
          id={id}
          profilePicture={profilePicture}
        />
      )}
      {renderProductButton("Changelog", 
        <ChangelogProductWidget
          organization="solomonai"
          theme="light"
          locale="en"
          usersName="Solomon"
          className="m-3"
          email={email}
          name={name}
          id={id}
          profilePicture={profilePicture}
          fullscreenPopup={true}
        />
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
    <Button variant="ghost" className="flex flex-1 items-center gap-2 border-0 w-full justify-start">
      {icon}
      <span className="text-lg">{label}</span>
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
    <Button variant="ghost" className="flex flex-1 items-center gap-2 border-0 w-full justify-start">
      {widget}
      <span className="text-lg">{label}</span>
    </Button>
  );

  return (
    <div className="relative">
      {renderToggleButton()}
      {isOpen && renderWidgetContent()}
    </div>
  );
};

export default AccessibilityWidget;
