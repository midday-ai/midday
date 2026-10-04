import {
  Body,
  Container,
  Heading,
  Preview,
  Text,
} from "@react-email/components";
import { EmailThemeProvider } from "../components/theme";
export function SignInOtpEmail({ otp }: { otp: string }) {
  return (
    <EmailThemeProvider preview={<Preview>Your Midday sign-in code</Preview>}>
      <Body>
        <Container>
          <Heading>Sign in to Midday</Heading>
          <Text>Your sign-in code is:</Text>
          <Text style={{ fontSize: 32, letterSpacing: 6 }}>{otp}</Text>
          <Text>
            This code expires in 10 minutes. If you did not request it, you can
            ignore this email.
          </Text>
        </Container>
      </Body>
    </EmailThemeProvider>
  );
}
