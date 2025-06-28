import { getEmailUrl } from "@midday/utils/envs";
import { Img, Link, Section } from "@react-email/components";

const baseUrl = getEmailUrl();

export function LogoFooter() {
  return (
    <Section>
      <style>{`
          .logo-blend {
            filter: none;
          }
          
          /* Regular dark mode - exclude Outlook.com and disable-dark-mode class */
          @media (prefers-color-scheme: dark) {
            .logo-blend:not([class^="x_"]):not(.disable-dark-mode .logo-blend) {
              filter: invert(1) brightness(1);
            }
          }
          
          /* Outlook.com specific dark mode targeting - but not when dark mode is disabled */
          [data-ogsb]:not(.disable-dark-mode) .logo-blend,
          [data-ogsc]:not(.disable-dark-mode) .logo-blend,
          [data-ogac]:not(.disable-dark-mode) .logo-blend,
          [data-ogab]:not(.disable-dark-mode) .logo-blend {
            filter: invert(1) brightness(1);
          }
          
          /* Force no filter when dark mode is disabled */
          .disable-dark-mode .logo-blend {
            filter: none !important;
          }
        `}</style>

      <Link href="https://go.midday.ai/FZwOHud">
        <Img
          src={`${baseUrl}/email/logo-footer.png`}
          width="80"
          alt="Midday"
          className="block logo-blend"
        />
      </Link>
    </Section>
  );
}
