import { getStaticParams } from "@/locales/server";
import { setStaticParamsLocale } from "next-international/server";

export function generateStaticParams() {
	return getStaticParams();
}

export default function Page({
	params: { locale },
}: { params: { locale: string } }) {
	setStaticParamsLocale(locale);

	return (
		<div className="mx-auto w-full max-w-xl">
			<div className="flex justify-between py-6">Hello</div>
		</div>
	);
}
