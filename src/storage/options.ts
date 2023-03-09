import connectors, { ConnectorMeta } from '@/core/connectors';
import * as BrowserStorage from '@/storage/browser-storage';

const options = BrowserStorage.getStorage(BrowserStorage.OPTIONS);
const connectorsOptions = BrowserStorage.getStorage(
	BrowserStorage.CONNECTORS_OPTIONS
);
const connectorsOverrideOptions = BrowserStorage.getStorage(
	BrowserStorage.CONNECTORS_OVERRIDE_OPTIONS
);

export const FORCE_RECOGNIZE = 'forceRecognize';
export const USE_NOTIFICATIONS = 'useNotifications';
export const SCROBBLE_PERCENT = 'scrobblePercent';
export const DISABLED_CONNECTORS = 'disabledConnectors';
export const USE_UNRECOGNIZED_SONG_NOTIFICATIONS =
	'useUnrecognizedSongNotifications';
export const SCROBBLE_PODCASTS = 'scrobblePodcasts';
export const DISABLE_GA = 'disableGa';

export interface GlobalOptions {
	/**
	 * Force song recognition.
	 */
	[FORCE_RECOGNIZE]: boolean;

	/**
	 * Use now playing notifications.
	 */
	[USE_NOTIFICATIONS]: boolean;

	/**
	 * Scrobble percent.
	 */
	[SCROBBLE_PERCENT]: number;

	/**
	 * Object contains info of disabled connectors.
	 * Each key is a connector ID. If the connector is disabled,
	 * key value should be true. If connector is enabled, key should not exist.
	 */
	[DISABLED_CONNECTORS]: { [connectorId: string]: boolean };

	/**
	 * Notify if song is not recognized.
	 */
	[USE_UNRECOGNIZED_SONG_NOTIFICATIONS]: boolean;

	/**
	 * Scrobble podcast episodes.
	 */
	[SCROBBLE_PODCASTS]: boolean;

	/**
	 * Disable Google Analytics.
	 */
	[DISABLE_GA]: boolean;
}

/**
 * Object that stores default option values.
 */
const DEFAULT_OPTIONS: GlobalOptions = {
	[FORCE_RECOGNIZE]: false,
	[SCROBBLE_PODCASTS]: true,
	[USE_NOTIFICATIONS]: true,
	[USE_UNRECOGNIZED_SONG_NOTIFICATIONS]: false,
	[SCROBBLE_PERCENT]: 50,
	[DISABLED_CONNECTORS]: {},
	[DISABLE_GA]: true,
};

const OVERRIDE_CONTENT = {
	[FORCE_RECOGNIZE]: false,
	[SCROBBLE_PODCASTS]: true,
	[USE_NOTIFICATIONS]: true,
	[USE_UNRECOGNIZED_SONG_NOTIFICATIONS]: false,
};

export interface ConnectorOptions {
	YouTube: {
		scrobbleMusicOnly: boolean;
		scrobbleEntertainmentOnly: boolean;
	};
}

/**
 * Object that stores default option values for specific connectors.
 */
const DEFAULT_CONNECTOR_OPTIONS: ConnectorOptions = {
	YouTube: {
		scrobbleMusicOnly: false,
		scrobbleEntertainmentOnly: false,
	},
};

export interface ConnectorsOverrideOptionValues {
	[FORCE_RECOGNIZE]?: boolean;
	[USE_NOTIFICATIONS]?: boolean;
	[SCROBBLE_PODCASTS]?: boolean;
	[USE_UNRECOGNIZED_SONG_NOTIFICATIONS]?: boolean;
}

export interface ConnectorsOverrideOptions {
	[connectorId: string]: ConnectorsOverrideOptionValues;
}

export type SavedEdit = {
	album: string | null;
	albumArtist: string | null;
	artist: string;
	track: string;
};

/**
 * Setup default options values.
 * This function is called on module init.
 */
async function setupDefaultConfigValues() {
	const data = { ...DEFAULT_OPTIONS, ...(await options.get()) };

	await options.set(data);
	void options.debugLog([DISABLED_CONNECTORS]);

	const connectorData = {
		...DEFAULT_CONNECTOR_OPTIONS,
		...(await connectorsOptions.get()),
	};
	for (const connectorKey in DEFAULT_CONNECTOR_OPTIONS) {
		const typedKey = connectorKey as keyof ConnectorOptions;
		connectorData[typedKey] = {
			...DEFAULT_CONNECTOR_OPTIONS[typedKey],
			...connectorData[typedKey],
		};
	}
	await connectorsOptions.set(connectorData);

	void connectorsOptions.debugLog();
	void connectorsOverrideOptions.debugLog();
}

async function cleanupConfigValues() {
	const data = await options.get();
	if (!data) {
		throw new Error('No options data found');
	}

	for (const connectorId of Object.keys(data[DISABLED_CONNECTORS])) {
		let isFound = false;

		for (const connector of connectors) {
			if (connector.id === connectorId) {
				isFound = true;
				break;
			}
		}

		if (!isFound) {
			delete data[DISABLED_CONNECTORS][connectorId];
			console.log(`Remove ${connectorId} from storage`);
		}
	}
}

export async function getOption(
	key: string,
	connector?: string
): Promise<unknown> {
	if (!assertValidOverride(key)) {
		return;
	}

	if (connector !== undefined) {
		const optionValue = await getConnectorOverrideOption(connector, key);
		if (optionValue !== undefined) {
			return optionValue;
		}
	}

	const data = await options.get();
	return data?.[key];
}

export async function setOption<T extends keyof GlobalOptions>(
	key: T,
	value: GlobalOptions[T]
): Promise<void> {
	if (!assertValidOptionKey(key)) {
		return;
	}

	await options.update({ [key]: value });
}

// TODO: the types could be a little stricter on these functions, but it's not too bad
export async function getConnectorOption(
	connector: string,
	key: string
): Promise<boolean | undefined> {
	if (!assertValidConnector(connector)) {
		return;
	}
	if (!assertValidConnectorOptionKey(connector, key)) {
		return;
	}

	const data = await connectorsOptions.get();
	return data?.[connector][key];
}

export async function setConnectorOption(
	connector: string,
	key: string,
	value: boolean
): Promise<void> {
	if (!assertValidConnector(connector)) {
		return;
	}
	if (!assertValidConnectorOptionKey(connector, key)) {
		return;
	}

	const data = await connectorsOptions.get();
	if (!data?.[connector]) {
		throw new Error(`Connector ${connector} not found in storage`);
	}
	data[connector][key] = value;

	await connectorsOptions.set(data);
}

export async function getConnectorOverrideOption(
	connector: string,
	key: keyof ConnectorsOverrideOptionValues
): Promise<boolean | undefined> {
	const data = await connectorsOverrideOptions.get();
	return data?.[connector]?.[key];
}

export async function setConnectorOverrideOption(
	connector: string,
	key: keyof ConnectorsOverrideOptionValues,
	value: boolean | undefined
): Promise<void> {
	const data = await connectorsOverrideOptions.get();
	if (!data) {
		throw new Error('No connectors override data found');
	}
	if (!data[connector]) {
		data[connector] = {};
	}
	data[connector][key] = value;

	await connectorsOverrideOptions.set(data);
}

function assertValidOptionKey(key: string): key is keyof GlobalOptions {
	if (!(key in DEFAULT_OPTIONS)) {
		throw new Error(`Unknown option key: ${key}`);
	}
	return true;
}

function assertValidOverride(
	key: string
): key is keyof ConnectorsOverrideOptionValues {
	if (!(key in OVERRIDE_CONTENT)) {
		throw new Error(`Unknown override key: ${key}`);
	}
	return true;
}

function assertValidConnector(
	connector: string
): connector is keyof ConnectorOptions {
	if (!(connector in DEFAULT_CONNECTOR_OPTIONS)) {
		throw new Error(`Unknown connector: ${connector}`);
	}
	return true;
}

function assertValidConnectorOptionKey(
	connector: keyof ConnectorOptions,
	key: string
): key is keyof ConnectorOptions[keyof ConnectorOptions] {
	if (!(key in DEFAULT_CONNECTOR_OPTIONS[connector])) {
		throw new Error(`Unknown connector option key: ${key}`);
	}
	return true;
}

/**
 * Check if connector is enabled.
 * @param connector - Connector
 * @returns Check result
 */
export async function isConnectorEnabled(
	connector: ConnectorMeta
): Promise<boolean> {
	const data = await options.get();
	if (!data) {
		throw 'No options data found';
	}
	return !data[DISABLED_CONNECTORS][connector.id] === true;
}

/**
 * Enable or disable connector.
 * @param connector - Connector
 * @param state - True if connector is enabled; false otherwise
 */
export async function setConnectorEnabled(
	connector: ConnectorMeta,
	state: boolean
): Promise<void> {
	const data = await options.get();
	if (!data) {
		throw 'No options data found';
	}

	if (state) {
		delete data[DISABLED_CONNECTORS][connector.id];
	} else {
		data[DISABLED_CONNECTORS][connector.id] = true;
	}

	await options.set(data);
}

/**
 * Enable or disable all connectors.
 * @param state - True if connector is enabled; false otherwise
 */
export async function setAllConnectorsEnabled(state: boolean): Promise<void> {
	const data = await options.get();
	if (!data) {
		throw 'No options data found';
	}

	data[DISABLED_CONNECTORS] = {};
	if (!state) {
		for (const connector of connectors) {
			data[DISABLED_CONNECTORS][connector.id] = true;
		}
	}

	await options.set(data);
}

void setupDefaultConfigValues().then(cleanupConfigValues);