import { FaGithub } from "react-icons/fa";
import { FaProductHunt } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { FaDiscord } from "react-icons/fa6";

export function SocialLinks() {
  return (
    <ul className="flex space-x-4 items-center ml-5">
      <li>
        <a href="https://go.midday.ai/lS72Toq">
          <FaXTwitter
            size={22}
            className="fill-[#707070] dark:fill-[#878787]"
          />
        </a>
      </li>
      <li>
        <a href="https://go.midday.ai/7rhA3rz">
          <FaProductHunt
            size={22}
            className="fill-[#707070] dark:fill-[#878787]"
          />
        </a>
      </li>
      <li>
        <a href="https://go.midday.ai/anPiuRx">
          <FaDiscord size={24} className="fill-[#707070] dark:fill-[#878787]" />
        </a>
      </li>
      <li>
        <a href="https://git.new/midday">
          <FaGithub size={22} className="fill-[#707070] dark:fill-[#878787]" />
        </a>
      </li>
    </ul>
  );
}
