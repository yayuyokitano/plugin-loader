import * as BrowserStorage from "@/storage/browser-storage";
import * as Options from "@/storage/options";
import { t } from "@/util/i18n";
import { Resource, ResourceActions, createResource } from "solid-js";
import styles from "./components.module.scss";

const globalOptions = BrowserStorage.getStorage(BrowserStorage.OPTIONS);
const connectorOptions = BrowserStorage.getStorage(BrowserStorage.CONNECTORS_OPTIONS);

export default function OptionsComponent() {
	return (
		<>
		<h1>{t("optionsOptions")}</h1>
		<GlobalOptionsList />
		<ConnectorOptionsList />
		<EditedTracks />
		</>
	)
}

function Checkbox(props:{
	title:string,
	label: string,
	isChecked: () => boolean,
	onInput: (e: InputEvent & {
		currentTarget: HTMLInputElement;
		target: Element;
	}) => void,
}) {
	const {title, label, isChecked, onInput} = props;
	return(
		<li class={styles.checkboxOption}>
			<label title={title}>
				{label}
				<input
					type="checkbox"
					checked={isChecked()}
					onInput={onInput}
				/>
				<span class={styles.checkboxWrapper}><span class={styles.checkbox} /></span>
			</label>
		</li>
	);
}

function ConnectorOptionEntry<K extends keyof Options.ConnectorOptions>(props:{
	options: Resource<Options.ConnectorOptions | null>,
	setOptions: ResourceActions<Options.ConnectorOptions | null | undefined, unknown>,
	i18ntitle: string,
	i18nlabel: string,
	connector: K,
	key: keyof Options.ConnectorOptions[K],
}) {
	const {options, setOptions, i18ntitle, i18nlabel, connector, key} = props;
	return <Checkbox
		title={t(i18ntitle)}
		label={t(i18nlabel)}
		isChecked={() => options()?.[connector]?.[key] as boolean}
		onInput={(e) => {
			setOptions.mutate((o) => {
				if (!o)	return o;
				const newOptions = {
					...o,
					[connector]: {
						...o[connector],
						[key]: e.currentTarget.checked,
					}
				};
				connectorOptions.set(newOptions);
				return newOptions;
			});
		}}
	/>
}

function ConnectorOptionsList() {
	const [options, setOptions] = createResource(connectorOptions.get.bind(connectorOptions));
	return (
		<>
		<h2>YouTube</h2>
		<ul>
			<ConnectorOptionEntry
				options={options}
				setOptions={setOptions}
				i18ntitle="optionYtMusicOnlyTitle"
				i18nlabel="optionYtMusicOnly"
				connector="YouTube"
				key="scrobbleMusicOnly"
			/>
			<ConnectorOptionEntry
				options={options}
				setOptions={setOptions}
				i18ntitle="optionYtEntertainmentOnlyTitle"
				i18nlabel="optionYtEntertainmentOnly"
				connector="YouTube"
				key="scrobbleEntertainmentOnly"
			/>
		</ul>
		<p class={styles.muted}>{t("optionYtDesc")}</p>
		</>
	)
}

function GlobalOptionEntry(props:{
	options: Resource<Options.GlobalOptions | null>,
	setOptions: ResourceActions<Options.GlobalOptions | null | undefined, unknown>,
	i18ntitle: string,
	i18nlabel: string,
	key: keyof Options.GlobalOptions,
}) {
	const {options, setOptions, i18ntitle, i18nlabel, key} = props;
	return <Checkbox
		title={t(i18ntitle)}
		label={t(i18nlabel)}
		isChecked={() => options()?.[key] as boolean}
		onInput={(e) => {
			setOptions.mutate((o) => {
				if (!o)	return o;
				const newOptions = {
					...o,
					[key]: e.currentTarget.checked,
				};
				globalOptions.set(newOptions);
				return newOptions;
			});
		}}
	/>
}

function GlobalOptionsList() {
	const [options, setOptions] = createResource(globalOptions.get.bind(globalOptions));
	return (
		<>
		<h2>{t("optionsGeneral")}</h2>
		<ul>
			<GlobalOptionEntry
				options={options}
				setOptions={setOptions}
				i18ntitle="optionUseNotificationsTitle"
				i18nlabel="optionUseNotifications"
				key={Options.USE_NOTIFICATIONS}
			/>
			<GlobalOptionEntry
				options={options}
				setOptions={setOptions}
				i18ntitle="optionUnrecognizedNotificationsTitle"
				i18nlabel="optionUnrecognizedNotifications"
				key={Options.USE_UNRECOGNIZED_SONG_NOTIFICATIONS}
			/>
			<GlobalOptionEntry
				options={options}
				setOptions={setOptions}
				i18ntitle="optionForceRecognizeTitle"
				i18nlabel="optionForceRecognize"
				key={Options.FORCE_RECOGNIZE}
			/>
			<GlobalOptionEntry
				options={options}
				setOptions={setOptions}
				i18ntitle="optionScrobblePodcastsTitle"
				i18nlabel="optionScrobblePodcasts"
				key={Options.SCROBBLE_PODCASTS}
			/>
		</ul>
		</>
	)
}

function EditedTracks() {
	return (
		<>
		<h2>{t("optionsEditedTracks")}</h2>
		<p>{t("optionsEditedTracksDesc")}</p>
		</>
	)
}
