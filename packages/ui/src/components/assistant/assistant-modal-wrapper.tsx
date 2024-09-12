import React from "react";

import { AssistantModal } from "../assistant-modal";

/**
 * Props for the Assistant component.
 *
 * @interface AssistantProps
 * @property {string} [className] - Additional CSS classes to apply to the container.
 * @property {boolean} [initialOpen=false] - Whether the assistant modal should be open initially.
 */
interface AssistantProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Assistant component that renders a button to open an assistant modal.
 *
 * @component
 * @example
 * ```tsx
 * <Assistant className="my-custom-class" initialOpen={true} />
 * ```
 *
 * @param {AssistantProps} props - The component props.
 * @returns {React.ReactElement} The rendered Assistant component.
 */
const AssistantModalWrapper: React.FC<AssistantProps> = ({
  className = "",
  children,
}) => {
  return (
    <div
      className={`flex h-full w-full items-center justify-center p-4 ${className}`.trim()}
    >
      {children}
      <AssistantModal />
    </div>
  );
};

export default AssistantModalWrapper;
