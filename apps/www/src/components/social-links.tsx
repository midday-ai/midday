import { FaGithub, FaLinkedinIn, FaProductHunt } from "react-icons/fa";
import { FaDiscord, FaXTwitter } from "react-icons/fa6";

export function SocialLinks() {
  return (
    <ul className="flex items-center space-x-4 md:ml-5">
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://go.solomon-ai.app/lS72Toq"
        >
          <span className="sr-only">Twitter</span>
          <FaXTwitter size={22} className="fill-[#878787]" />
        </a>
      </li>
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://go.solomon-ai.app/7rhA3rz"
        >
          <span className="sr-only">Producthunt</span>
          <FaProductHunt size={22} className="fill-[#878787]" />
        </a>
      </li>
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://go.solomon-ai.app/anPiuRx"
        >
          <span className="sr-only">Discord</span>
          <FaDiscord size={24} className="fill-[#878787]" />
        </a>
      </li>
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://github.com/SolomonAIEngineering/orbitkit"
        >
          <span className="sr-only">Github</span>
          <FaGithub size={22} className="fill-[#878787]" />
        </a>
      </li>
      <li>
        <a
          target="_blank"
          rel="noreferrer"
          href="https://go.solomon-ai.app/Ct3xybK"
        >
          <span className="sr-only">LinkedIn</span>
          <FaLinkedinIn size={22} className="fill-[#878787]" />
        </a>
      </li>
    </ul>
  );
}
