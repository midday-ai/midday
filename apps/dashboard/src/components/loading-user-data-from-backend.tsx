import React from "react";

interface LoadingUserDataFromBackendProps {
  message?: string;
}

const LoadingUserDataFromBackend: React.FC<LoadingUserDataFromBackendProps> = ({
  message = "Welcome To Solomon AI",
}) => {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center animate-backgroundChange">
      <div className="flex flex-col items-center space-y-4">
        <div className="h-12 w-12 animate-spin text-primary" />
        <p className="animate-textColorChange md:text-6xl font-bold">
          {message}
        </p>
      </div>
      <style jsx>{`
                @keyframes backgroundChange {
                    0%, 100% { background-color: black; }
                    50% { background-color: white; }
                }
                @keyframes textColorChange {
                    0%, 100% { color: white; }
                    50% { color: black; }
                }
                .animate-backgroundChange {
                    animation: backgroundChange 4s infinite;
                }
                .animate-textColorChange {
                    animation: textColorChange 4s infinite;
                }
            `}</style>
    </div>
  );
};

export default LoadingUserDataFromBackend;
