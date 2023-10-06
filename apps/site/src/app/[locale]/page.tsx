import { StartPage } from "@/components/startpage";
import { getStaticParams } from "@/locales/server";
import { setStaticParamsLocale } from "next-international/server";

export function generateStaticParams() {
	return getStaticParams();
}

export default function Page({
	params: { locale },
}: {
	params: { locale: string };
}) {
	setStaticParamsLocale(locale);

	return <StartPage />;
}
