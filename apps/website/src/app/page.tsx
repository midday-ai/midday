import { StartPage } from "@/components/startpage";

export const revalidate = 3600;

export default async function Page() {
  return <StartPage />;
}
