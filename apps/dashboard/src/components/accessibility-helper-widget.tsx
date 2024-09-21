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
import { CircleIcon, XIcon } from "lucide-react";
import React, { useCallback, useState } from "react";
import ChatAccessibilityButton from "./chat-accessibility-button";
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
      <Card className="fixed bottom-20 left-20 p-6 shadow-lg md:min-w-[200px]">
        <div className="flex justify-between items-center mb-4">
          <Button variant="ghost" size="icon" onClick={toggleWidget}>
            <XIcon className="h-6 w-6" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
        <div className="flex flex-col md:max-h-96 scrollbar-hide overflow-y-auto my-[2.5%] md:min-h-64">
          <div className="flex flex-col gap-4 items-start">
            {renderChatButton()}
            {renderProductUpdatesButton()}
            {renderFeedbackButton()}
            {renderChangelogButton()}
          </div>
        </div>
      </Card>
    </div>
  );

  /**
   * Renders the chat accessibility button.
   *
   * @returns {React.ReactElement} The rendered chat button.
   */
  const renderChatButton = () => (
    <Button variant="ghost" className="flex flex-1 items-center gap-2 border-0">
      <ChatAccessibilityButton className="m-3" />
      <span className="text-lg">Ask Solomon</span>
    </Button>
  );

  /**
   * Renders the product updates button.
   *
   * @returns {React.ReactElement} The rendered product updates button.
   */
  const renderProductUpdatesButton = () => (
    <Button variant="ghost" className="flex flex-1 items-center gap-2 border-0">
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
      <span className="text-lg">Product Updates</span>
    </Button>
  );

  /**
   * Renders the feedback button.
   *
   * @returns {React.ReactElement} The rendered feedback button.
   */
  const renderFeedbackButton = () => (
    <Button variant="ghost" className="flex flex-1 items-center gap-2 border-0">
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
      <span className="text-lg">Feedback</span>
    </Button>
  );

  /**
   * Renders the changelog button.
   *
   * @returns {React.ReactElement} The rendered changelog button.
   */
  const renderChangelogButton = () => (
    <Button variant="ghost" className="flex flex-1 items-center gap-2 border-0">
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
      <span className="text-lg">Changelog</span>
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
