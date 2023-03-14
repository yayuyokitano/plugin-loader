import { render } from "solid-js/web";
import styles from "./settings.module.scss";
import { initializeThemes } from "@/theme/themes";
import "@/theme/themes.scss";
import { createSignal } from "solid-js";
import ShowSomeLove from "./components/showSomeLove";
import Favorite from "@suid/icons-material/FavoriteOutlined";
import Info from "@suid/icons-material/InfoOutlined";
import Help from "@suid/icons-material/HelpOutlined";
import Contacts from "@suid/icons-material/ContactsOutlined";
import Sidebar from "./sidebar/sidebar";
import InfoComponent from "@/ui/options/components/info";
import FAQ from "./components/faq";
import ContactComponent from "./components/contact";

export type Settings = {
	namei18n: "contactTitle",
	icon: typeof Contacts,
	element: typeof ContactComponent,
} | {
	namei18n: "faqTitle",
	icon: typeof Help,
	element: typeof FAQ,
} | {
	namei18n: "optionsAbout",
	icon: typeof Info,
	element: typeof InfoComponent,
} | {
	namei18n: "showSomeLoveTitle",
	icon: typeof Favorite,
	element: typeof ShowSomeLove,
}

const settings: Settings[] = [
	{namei18n: "contactTitle", icon: Contacts, element: ContactComponent},
	{namei18n: "faqTitle", icon: Help, element: FAQ},
	{namei18n: "optionsAbout", icon: Info, element: InfoComponent},
	{namei18n: "showSomeLoveTitle", icon: Favorite, element: ShowSomeLove},
];

function Options() {
	const [activeSetting, setActiveSetting] = createSignal<Settings>({namei18n: "showSomeLoveTitle", icon: Favorite, element: ShowSomeLove})

	return (
		<div class={styles.settings}>
			<Sidebar
				items={settings}
				activeSetting={activeSetting}
				setActiveSetting={setActiveSetting}
			/>
			<div class={styles.settingsContentWrapper}>
				<div class={styles.settingsContent}>
					{activeSetting().element()}
				</div>
			</div>
		</div>
	)
}

const root = document.getElementById("root");
if (!root) {
	throw new Error("Root element not found");
}
render(Options, root);
void initializeThemes();
