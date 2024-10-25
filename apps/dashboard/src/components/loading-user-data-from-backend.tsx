import { Loader2 } from "lucide-react";
import React from "react";

interface LoadingUserDataFromBackendProps {
  message?: string;
  subMessage?: string;
}

const LoadingDots = () => (
  <div className="flex space-x-2">
    <div className="h-2 w-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite]" />
    <div className="h-2 w-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite_200ms]" />
    <div className="h-2 w-2 bg-white rounded-full animate-[bounce_1s_ease-in-out_infinite_400ms]" />
  </div>
);

const LoadingUserDataFromBackend: React.FC<LoadingUserDataFromBackendProps> = ({
  message = "Welcome To Solomon AI",
  subMessage = "Loading your personalized experience...",
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black transition-colors duration-1000 animate-pulse">
      <div className="relative flex flex-col items-center space-y-8 p-8 rounded-lg">
        {/* Decorative elements */}
        <div className="absolute inset-0 bg-white opacity-5 blur-xl rounded-lg" />

        {/* Main content */}
        <div className="relative flex flex-col items-center space-y-6">
          {/* Animated loader */}
          <div className="relative">
            <div className="absolute -inset-4 bg-white rounded-full opacity-10 animate-pulse blur-sm" />
            <Loader2 className="h-10 w-10 text-white animate-spin" />
          </div>

          {/* Main message */}
          <div className="flex flex-col items-center space-y-4">
            <h1 className="text-4xl md:text-6xl font-bold text-white animate-pulse">
              {message}
            </h1>

            {/* Sub message */}
            <p className="text-lg md:text-xl text-gray-400 text-center animate-pulse">
              {subMessage}
            </p>
          </div>

          {/* Loading dots with proper animation */}
          <LoadingDots />
        </div>
      </div>
    </div>
  );
};

export default LoadingUserDataFromBackend;
