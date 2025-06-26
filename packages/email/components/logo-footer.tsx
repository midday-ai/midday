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
          
          /* Regular dark mode - exclude Outlook.com */
          @media (prefers-color-scheme: dark) {
            .logo-blend:not([class^="x_"]) {
              filter: invert(1) brightness(1);
            }
          }
          
          /* Outlook.com specific dark mode targeting */
          [data-ogsb] .logo-blend,
          [data-ogsc] .logo-blend,
          [data-ogac] .logo-blend,
          [data-ogab] .logo-blend {
            filter: invert(1) brightness(1);
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
