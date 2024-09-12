import React from "react";

import { AssistantSidebar } from "../assistant-sidebar";

/**
 * Props for the AssistantModal component.
 *
 * @interface AssistantSidebarWrapperProps
 * @property {string} [className] - Additional CSS classes to apply to the container.
 * @property {boolean} [initialOpen=false] - Whether the AssistantModal modal should be open initially.
 */
interface AssistantSidebarWrapperProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * AssistantSidebarWrapper component that renders a button to open an AssistantModal modal.
 *
 * @component
 * @example
 * ```tsx
 * <AssistantSidebarWrapper className="my-custom-class" initialOpen={true} />
 * ```
 *
 * @param {AssistantSidebarWrapperProps} props - The component props.
 * @returns {React.ReactElement} The rendered AssistantModal component.
 */
const AssistantSidebarWrapper: React.FC<AssistantSidebarWrapperProps> = ({
  className = "",
  children,
}) => {
  return (
    <div className={`h-full ${className}`.trim()}>
      {children ? (
        <AssistantSidebar>{children}</AssistantSidebar>
      ) : (
        <AssistantSidebar />
      )}
    </div>
  );
};

export default AssistantSidebarWrapper;
