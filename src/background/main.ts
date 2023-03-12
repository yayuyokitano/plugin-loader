import { getConnectorByUrl } from '@/core/content/util-connector';
import * as BrowserStorage from '@/storage/browser-storage';
import {
	backgroundListener,
	setupBackgroundListeners,
} from '@/util/communication';
import browser from 'webextension-polyfill';

browser.runtime.onStartup.addListener(() => {
	const state = BrowserStorage.getStorage(BrowserStorage.STATE_MANAGEMENT);
	state.set({
		activeTabs: [],
	});
});

async function getActiveConnector(activeTabs: number[]) {
	while (activeTabs && activeTabs.length) {
		try {
			const tab = await browser.tabs.get(activeTabs[0]);
			const connector = await getConnectorByUrl(tab.url ?? '');
			if (!connector) {
				activeTabs = activeTabs.slice(1);
				continue;
			}
			return {
				activeTabs,
				activeConnector: connector.label,
			};
		} catch (err) {
			activeTabs = activeTabs.slice(1);
			continue;
		}
	}
	return {
		activeTabs: [],
		activeConnector: '',
	};
}

browser.tabs.onUpdated.addListener(async (tabId, _, tab) => {
	const { activeTabs } = (await browser.storage.local.get('activeTabs')) as {
		activeTabs: number[];
	};
	let newTabs = activeTabs?.filter((activeId) => activeId !== tabId) ?? [];

	const connector = await getConnectorByUrl(tab.url ?? '');
	if (connector) {
		newTabs = [tabId, ...newTabs];
	}

	browser.storage.local.set(await getActiveConnector(newTabs));
});

browser.tabs.onActivated.addListener(async ({ tabId }) => {
	const { activeTabs } = (await browser.storage.local.get('activeTabs')) as {
		activeTabs: number[];
	};
	const oldLen = activeTabs.length;
	let newTabs = activeTabs?.filter((activeId) => activeId !== tabId) ?? [];

	if (oldLen !== newTabs.length) {
		newTabs = [tabId, ...newTabs];
	}

	browser.storage.local.set(await getActiveConnector(newTabs));
});

setupBackgroundListeners(
	backgroundListener({
		type: 'startedPlaying',
		fn: (state) => {
			console.log('started playing');
			console.log(state);
		},
	}),
	backgroundListener({
		type: 'scrobbled',
		fn: (state) => {
			console.log('scrobbled');
			console.log(state);
		},
	})
);
