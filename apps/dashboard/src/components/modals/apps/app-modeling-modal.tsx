import { addAppToAccountAction } from "@/actions/add-app-to-account-action";
import config from "@/config";
import { capitalize } from "@/utils/utils";
import {
  IntegrationCategory,
  IntegrationConfig,
} from "@midday/app-store/types";
import { Button } from "@midday/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@midday/ui/dialog";
import { useToast } from "@midday/ui/use-toast";
import { DownloadCloudIcon, Loader2 } from "lucide-react";
import { useAction } from "next-safe-action/hooks";

interface AppsModellingModalProps {
  isOpen: boolean;
  onClose: () => void;
  appType: IntegrationCategory.Modelling | IntegrationCategory.GoalTemplates;
  id: string;
  installed: boolean;
  cfg: IntegrationConfig;
}

export function AppsModellingModal({
  isOpen,
  onClose,
  appType,
  cfg,
  id,
  installed,
}: AppsModellingModalProps) {
  const { toast } = useToast();
  const {
    category,
    short_description,
    description,
    name: appName,
    logo: Logo,
  } = cfg;

  const addAppToAccount = useAction(addAppToAccountAction, {
    onSuccess: () => {
      onClose();
      toast({
        duration: 4000,
        title: `Successfully added ${appName} app to your account.`,
        variant: "success",
      });
    },
    onError: (error) => {
      console.log(error);
      toast({
        duration: 4000,
        title: `Failed to add ${appName} app to your account.`,
        variant: "error",
        description: `Error: ${JSON.stringify(error)}`,
      });
    },
  });

  const handleConfirm = () => {
    const { calculate, ...equationConfigWithoutCalculate } = cfg.equation || {};

    addAppToAccount.execute({
      app_id: id,
      app_name: appName,
      category: category,
      config: cfg.config,
      data_sync_frequency: null,
      dependencies: cfg.dependencies,
      equationConfig: equationConfigWithoutCalculate,
      input_schema: cfg.input_schema,
      output_schema: cfg.output_schema,
      integration_config: cfg.config,
      is_public: cfg.is_public || false,
      model_type: cfg.model_type,
      settings: cfg.settings,
      sync_status: cfg.sync_status ?? "active",
      tags: cfg.tags ?? [],
      user_permissions: cfg.user_permissions,
      version: cfg.api_version,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[575px] md:min-h-[65%] flex flex-col backdrop-blur-2xl">
        <DialogHeader className="md:p-[5%] bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Logo />
              <div>
                <DialogTitle className="text-3xl font-bold">
                  {capitalize(appName)}
                </DialogTitle>
                <p className="text-sm opacity-80">
                  {capitalize(category)} • Published by {config.company}
                </p>
              </div>
            </div>
            {/* <div className="flex items-center space-x-2 pt-[3%]">
                            {installed && <Badge variant="outline">Installed</Badge>}
                            <Badge variant="outline" className="text-xs">{capitalize(category)}</Badge>
                        </div> */}
          </div>
          <div className="md:p-[2%]">
            <div className="flex justify-between">
              <Button
                onClick={handleConfirm}
                disabled={addAppToAccount.status === "executing"}
              >
                {addAppToAccount.status === "executing" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <DownloadCloudIcon className="mr-2" size={16} />
                )}
                Add to Account
              </Button>
            </div>
          </div>
          <p className="text-lg">{short_description}</p>
        </DialogHeader>

        {/* Add content here */}
        <div className="flex-grow" />

        <DialogFooter className="p-6 bg-muted mt-auto">
          <div className="flex justify-between items-center w-full">
            <p className="text-xs text-muted-foreground mx-[2]">
              All integrations on the {config.company} platform are open-source
              and peer-reviewed. {config.company} maintains high standards but
              doesn't endorse third-party apps. Apps published by{" "}
              {config.company}
              are officially certified. Report any concerns about app content or
              behavior.
            </p>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
