/**
 * Peppol E-Invoicing Logo
 *
 * A document icon with electronic/network styling representing e-invoicing.
 * Uses the Peppol brand colors (teal/green).
 */
export const Logo = () => {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Document base */}
      <path
        d="M8 4C8 2.89543 8.89543 2 10 2H21L28 9V32C28 33.1046 27.1046 34 26 34H10C8.89543 34 8 33.1046 8 32V4Z"
        fill="#00B4A0"
      />
      {/* Document fold */}
      <path d="M21 2L28 9H23C21.8954 9 21 8.10457 21 7V2Z" fill="#008577" />
      {/* Lines representing invoice data */}
      <rect x="12" y="14" width="12" height="2" rx="1" fill="white" />
      <rect
        x="12"
        y="19"
        width="8"
        height="2"
        rx="1"
        fill="white"
        opacity="0.7"
      />
      <rect
        x="12"
        y="24"
        width="10"
        height="2"
        rx="1"
        fill="white"
        opacity="0.7"
      />
      {/* Electronic/network indicator - small circles */}
      <circle cx="30" cy="18" r="3" fill="#00B4A0" />
      <circle cx="30" cy="26" r="2" fill="#00B4A0" opacity="0.7" />
      {/* Connection lines */}
      <path
        d="M28 18H30M28 24L29 25"
        stroke="#00B4A0"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};
