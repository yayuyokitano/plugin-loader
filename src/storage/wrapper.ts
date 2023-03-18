import { hideObjectValue } from '@/util/util';
import browser from 'webextension-polyfill';
import {
	CONNECTORS_OPTIONS,
	CONNECTORS_OVERRIDE_OPTIONS,
	CORE,
	CUSTOM_PATTERNS,
	LOCAL_CACHE,
	NOTIFICATIONS,
	OPTIONS,
	STATE_MANAGEMENT,
	StorageNamespace,
} from '@/storage/browser-storage';
import {
	ConnectorOptions,
	ConnectorsOverrideOptions,
	GlobalOptions,
	SavedEdit,
} from '@/storage/options';
import { ControllerModeStr } from '@/object/controller/controller';
import Song from '@/object/song';

export interface CustomPatterns {
	[connectorId: string]: string[];
}

export interface Properties {
	properties?: {
		userApiUrl: string;
		userToken: string;
	};
}

interface ListenBrainzAuthStarted extends Properties {
	isAuthStarted?: boolean;
}

interface ListenBrainzAuthFinished extends Properties {
	sessionID?: string;
	sessionName?: string;
}

export type ListenBrainzModel =
	| ListenBrainzAuthStarted
	| ListenBrainzAuthFinished;

export interface ScrobblerModels {
	LastFM?: { token?: string } | { sessionID?: string; sessionName?: string };
	LibreFM?: { token?: string } | { sessionID?: string; sessionName?: string };
	ListenBrainz?: ListenBrainzModel;
	Maloja?: Properties;
}

export interface ManagerTab {
	tabId: number;
	mode: ControllerModeStr;
	song: Song | null;
}

export interface StateManagement {
	activeTabs: ManagerTab[];
}

export interface DataModels extends ScrobblerModels {
	/* sync options */
	[CUSTOM_PATTERNS]: CustomPatterns;
	[OPTIONS]: GlobalOptions;
	[NOTIFICATIONS]: { authDisplayCount: number };
	[CONNECTORS_OPTIONS]: ConnectorOptions;
	[CONNECTORS_OVERRIDE_OPTIONS]: ConnectorsOverrideOptions;

	/* local options */
	[CORE]: { appVersion: string };
	[LOCAL_CACHE]: { [key: string]: SavedEdit };

	/* state management */
	[STATE_MANAGEMENT]: StateManagement;
}

/**
 * StorageArea wrapper that supports for namespaces.
 *
 * @typeParam K - Namespace key.
 */
export default class StorageWrapper<K extends keyof DataModels> {
	// V extends DataModels[K], T extends Record<K, V>
	private storage:
		| browser.Storage.SyncStorageAreaSync
		| browser.Storage.LocalStorageArea;
	private namespace: StorageNamespace;

	/**
	 * @param storage - StorageArea object
	 * @param namespace - Storage namespace
	 */
	constructor(
		storage:
			| browser.Storage.SyncStorageAreaSync
			| browser.Storage.LocalStorageArea,
		namespace: StorageNamespace
	) {
		this.storage = storage;
		this.namespace = namespace;
	}

	/**
	 * Read data from storage.
	 * @typeParam T - Data type
	 * @returns Storage data
	 */
	async get(): Promise<DataModels[K] | null> {
		const data = await this.storage.get();
		if (data && this.namespace in data) {
			return data[this.namespace] as DataModels[K];
		}

		return null;
	}

	/**
	 * Save data to storage.
	 * @param data - Data to save
	 */
	async set(data: DataModels[K]): Promise<void> {
		const dataToSave = {
			[this.namespace]: data,
		};

		await this.storage.set(dataToSave);
	}

	/**
	 * Extend saved data by given one.
	 * @param data - Data to add
	 */
	async update(data: Partial<DataModels[K]>): Promise<void> {
		const storageData = await this.get();
		const dataToSave = Object.assign(storageData ?? {}, data);

		// TODO: use default here instead of empty object to avoid this workaround
		await this.set(dataToSave as DataModels[K]);
	}

	/**
	 * Log storage data to console output.
	 * @param hiddenKeys - Array of keys should be hidden
	 */
	/* istanbul ignore next */
	async debugLog(hiddenKeys: string[] = []): Promise<void> {
		const data = await this.get();

		const hideSensitiveDataFn = (key: string, value: DataModels[K]) => {
			if (hiddenKeys.includes(key)) {
				return hideObjectValue(value);
			}
			if (typeof value !== 'string' && typeof value !== 'number') {
				return 'expected a number or a string';
			}

			return value;
		};

		const text = JSON.stringify(data, hideSensitiveDataFn, 2);
		console.info(`storage.${this.namespace} = ${text}`);
	}

	/**
	 * Clear storage.
	 */
	async clear(): Promise<void> {
		await this.storage.remove(this.namespace);
	}
}
