import { StartPage } from "@/components/startpage";

export const revalidate = 1800;

export default async function Page() {
  return <StartPage />;
}
