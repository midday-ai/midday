"use client";

import { AppsModellingModal } from "@/components/modals/apps/app-modeling-modal";
import { Button } from "@/components/ui/button";
import { getAppsMap } from "@midday/app-store";
import {
  IntegrationCategory,
  IntegrationConfig,
} from "@midday/app-store/types";
import { useToast } from "@midday/ui/use-toast";
import { Loader2 } from "lucide-react";
import React, { useState } from "react";

/**
 * Props for the `InstallAppButton` component.
 *
 * @property {string} id - The unique identifier for the app to be installed.
 * @property {boolean} active - Indicates whether the app is active and can be installed.
 * @property {IntegrationCategory} category - The category to which the app belongs, e.g., Modelling or GoalTemplates.
 * @property {boolean} installed - Indicates whether the app is already installed.
 */
interface InstallAppButtonProps {
  id: string;
  active: boolean;
  category: IntegrationCategory;
  installed: boolean;
}

/**
 * A button component that initializes and installs an app when clicked.
 *
 * This component handles the app installation process by invoking the `onInitialize` function from the app configuration,
 * based on the app's category. For Modelling and GoalTemplate apps, it opens a modal to continue the setup. For other apps,
 * it logs a message indicating completion and resets the loading state.
 *
 * @param {InstallAppButtonProps} props - The properties passed to the component.
 * @returns {JSX.Element | null} The rendered component or null if the app configuration is not found.
 *
 * @example
 * ```jsx
 * <InstallAppButton
 *   id="app-123"
 *   active={true}
 *   category={IntegrationCategory.Modelling}
 *   installed={false}
 * />
 * ```
 */
const InstallAppButton: React.FC<InstallAppButtonProps> = ({
  id,
  active,
  category,
  installed,
}) => {
  // State to track if the installation process is in progress.
  const [isLoading, setLoading] = useState(false);

  // State to control the visibility of the modelling modal.
  const [isModellingDialogOpen, setIsModellingDialogOpen] = useState(false);

  // Toast notifications hook for displaying errors.
  const { toast } = useToast();

  // Retrieve the app configuration using the app's ID.
  const appCfg = getAppsMap()[id];

  // If the app configuration is not found, render nothing.
  if (!appCfg) {
    return null;
  }

  // Function reference for app initialization.
  const onInitialize = appCfg.onInitialize;

  /**
   * Handles the initialization and installation of the app.
   *
   * Based on the app category, this function either opens the modelling modal for Modelling or GoalTemplates apps,
   * or completes the installation for other categories. If an error occurs during installation, it displays a toast
   * notification and resets the loading state.
   */
  const handleOnInitialize = () => {
    setLoading(true);
    try {
      // Check if the app belongs to the Modelling or GoalTemplates category.
      if (
        category === IntegrationCategory.Modelling ||
        category === IntegrationCategory.GoalTemplates
      ) {
        // Invoke the initialization function and open the modal on success.
        onInitialize?.(() => {
          setIsModellingDialogOpen(true);
        });
      } else {
        // For other categories, complete the initialization and reset loading state.
        onInitialize?.(() => {
          console.log("Non-modelling initialization completed");
          setLoading(false);
        });
      }
    } catch (error) {
      // Display error toast notification and reset loading state.
      toast({
        duration: 2500,
        variant: "error",
        title: "There was an error installing the app.",
        description: error instanceof Error ? error.message : String(error),
        draggable: true,
      });
      setLoading(false);
    }
  };

  return (
    <>
      {/* Render the installation button. Disable it if the app is already installed or initialization is not possible. */}
      <Button
        variant="outline"
        className="w-full border-primary"
        onClick={handleOnInitialize}
        disabled={!onInitialize || !active || isLoading || installed}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Installing...
          </>
        ) : (
          "Install"
        )}
      </Button>

      {/* Render the AppsModellingModal if the modelling dialog state is open. */}
      <AppsModellingModal
        isOpen={isModellingDialogOpen}
        onClose={() => {
          setIsModellingDialogOpen(false);
          setLoading(false);
        }}
        appType={
          category as
            | IntegrationCategory.GoalTemplates
            | IntegrationCategory.Modelling
        }
        id={id}
        installed={installed}
        cfg={appCfg}
      />
    </>
  );
};

export default InstallAppButton;
