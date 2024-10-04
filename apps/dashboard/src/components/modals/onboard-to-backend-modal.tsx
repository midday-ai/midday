"use client";

import features from "@/config/enabled-features";
import { Dialog, DialogContent } from "@midday/ui/dialog";
import { CreateAccountInBackendForm } from "../forms/create-account-in-backend-form";

/**
 * OnboardToBackendModal Component
 * 
 * This component renders a modal dialog for onboarding users to the backend system.
 * It displays a form for creating a username, which is a necessary step to start
 * using Solomon AI.
 * 
 * The modal's visibility is controlled by the `isOpen` state from the `useUserStore` hook.
 * If the backend feature is not enabled (controlled by the `features.isBackendEnabled` flag),
 * this component will not render anything.
 * 
 * @component
 * @example
 * ```tsx
 * <OnboardToBackendModal />
 * ```
 */
export function OnboardToBackendModal(props: {
    /**
     * The default open state of the modal.
     */
    defaultOpen?: boolean;
    open: boolean;
    setOpen: (open: boolean) => void;
}) {

    const { open, setOpen, defaultOpen } = props;

    // If the backend feature is not enabled, don't render the modal
    if (!features.isBackendEnabled) {
        return null;
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(newOpen) => {
                // Prevent closing the modal
                if (newOpen === false) return;
                setOpen(newOpen);
            }}
            defaultOpen={defaultOpen}
        >
            <DialogContent
                onEscapeKeyDown={(e) => {
                    // Prevent closing on Escape key
                    e.preventDefault();
                }}
                onInteractOutside={(e) => {
                    // Prevent closing on outside click
                    e.preventDefault();
                }}
                className="border border-border rounded-2xl"
            >
                <div className="p-[5%]">
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <h2 className="text-2xl font-semibold">
                                Create A Username
                            </h2>
                            <p className="text-muted-foreground">
                                Create a username to get started with Solomon AI.
                            </p>
                        </div>

                        <CreateAccountInBackendForm onSuccess={() => setOpen(false)} />
                    </div>
                </div>
            </DialogContent>
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md" aria-hidden="true" />
        </Dialog>
    );
}
