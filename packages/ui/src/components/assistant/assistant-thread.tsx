import React from "react";

import { Thread } from "../thread";

/**
 * Props for the AssistantModal component.
 *
 * @interface AssistantThreadWrapperProps
 * @property {string} [className] - Additional CSS classes to apply to the container.
 * @property {boolean} [initialOpen=false] - Whether the AssistantModal modal should be open initially.
 */
interface AssistantThreadWrapperProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * AssistantThreadWrapper component that renders a button to open an AssistantModal modal.
 *
 * @component
 * @example
 * ```tsx
 * <AssistantThreadWrapper className="my-custom-class" initialOpen={true} />
 * ```
 *
 * @param {AssistantThreadWrapperProps} props - The component props.
 * @returns {React.ReactElement} The rendered AssistantModal component.
 */
const AssistantThreadWrapper: React.FC<AssistantThreadWrapperProps> = ({
  className = "",
  children,
}) => {
  return (
    <div className={`h-full ${className}`.trim()}>
      <Thread />
    </div>
  );
};

export default AssistantThreadWrapper;
