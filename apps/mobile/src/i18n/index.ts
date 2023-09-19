import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import sv from "./locales/sv.json";

i18n.use(initReactI18next).init({
	compatibilityJSON: "v3",
	resources: {
		en: {
			translation: en,
		},
		sv: {
			translation: sv,
		},
	},
	lng: getLocales()?.at(0)?.languageCode,
	fallbackLng: "en",
	interpolation: {
		escapeValue: false,
	},
	returnNull: false,
});
