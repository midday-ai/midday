import { FaGithub } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaDiscord } from "react-icons/fa6";

export function SocialLinks() {
  return (
    <ul className="flex space-x-4 items-center ml-5">
      <li>
        <a href="https://go.midday.ai/lS72Toq">
          <FaXTwitter size={22} color="878787" />
        </a>
      </li>
      <li>
        <a href="https://go.midday.ai/7rhA3rz">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width={25}
            height={24}
            fill="none"
          >
            <path
              fill="#878787"
              d="M24.516 12c0 6.627-5.373 12-12 12-6.628 0-12-5.373-12-12 0-6.628 5.372-12 12-12 6.627 0 12 5.372 12 12Z"
            />
            <path
              fill="#121212"
              d="M14.116 12h-3.4V8.4h3.4a1.8 1.8 0 1 1 0 3.6Zm0-6h-5.8v12h2.4v-3.6h3.4a4.2 4.2 0 1 0 0-8.4Z"
            />
          </svg>
        </a>
      </li>
      <li>
        <a href="https://go.midday.ai/anPiuRx">
          <FaDiscord size={24} color="878787" />
        </a>
      </li>
      <li>
        <a href="https://git.new/midday">
          <FaGithub size={22} color="878787" />
        </a>
      </li>
    </ul>
  );
}
