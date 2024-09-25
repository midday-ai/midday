import { Button } from "@midday/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@midday/ui/dialog";

interface FeatureInDevelopmentProps {
    featureName: string;
    message?: string;
    isDisabled?: boolean;
}

export const FeatureInDevelopment: React.FC<FeatureInDevelopmentProps> = ({
    featureName,
    message = "We're working hard to bring you this feature soon.",
    isDisabled = false,
}) => {
    return (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
            <h3 className="text-xl font-semibold mb-4">{featureName}</h3>
            <p className="text-center mb-6">{message}</p>
            <Dialog>
                <DialogTrigger asChild>
                    <Button variant="default" disabled={isDisabled}>
                        {isDisabled ? "Coming Soon" : "Learn More"}
                    </Button>
                </DialogTrigger>
                <DialogContent className="md:min-w-[30%] p-[5%]">
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-bold">{featureName} {isDisabled ? "Coming Soon" : "Information"}</DialogTitle>
                        <DialogDescription className="text-lg font-semibold">
                            {isDisabled 
                                ? "This feature is currently in development. Our team is working hard to make it available to you soon."
                                : "Here's more information about this feature."}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        <p className="text-md text-muted-foreground">
                            {isDisabled
                                ? "We appreciate your patience as we work on bringing you the best possible experience."
                                : "This feature is still being refined. Your feedback is valuable to us."}
                        </p>
                        <p className="text-md text-muted-foreground">
                            Contact: support@solomon-ai.co
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};