import { getConnectorByUrl } from '@/core/content/util-connector';
import * as ControllerMode from '@/object/controller/controller-mode';
import * as BrowserStorage from '@/storage/browser-storage';
import { ManagerTab } from '@/storage/wrapper';
import {
	backgroundListener,
	setupBackgroundListeners,
} from '@/util/communication';
import browser from 'webextension-polyfill';
import { filterAsync } from './util';
import {
	ControllerModeStr,
	controllerModePriority,
} from '@/object/controller/controller';
import Song from '@/object/song';
import { t } from '@/util/i18n';

const state = BrowserStorage.getStorage(BrowserStorage.STATE_MANAGEMENT);
browser.runtime.onStartup.addListener(() => {
	state.set({
		activeTabs: [],
	});
});

async function filterInactiveTabs(activeTabs: ManagerTab[]) {
	return filterAsync(activeTabs, async (entry) => {
		try {
			if (entry.mode === ControllerMode.Unsupported) {
				return false;
			}
			const tab = await browser.tabs.get(entry.tabId);
			const connector = await getConnectorByUrl(tab.url ?? '');
			return connector !== null;
		} catch (err) {
			return false;
		}
	});
}

browser.tabs.onRemoved.addListener(async () => {
	const { activeTabs } = (await state.get()) ?? { activeTabs: [] };
	await state.set({
		activeTabs: await filterInactiveTabs(activeTabs),
	});
	void updateAction();
});

browser.tabs.onUpdated.addListener(async (tabId, _, tab) => {
	const { activeTabs } = (await state.get()) ?? { activeTabs: [] };
	let curTab: ManagerTab = {
		tabId,
		mode: ControllerMode.Unsupported,
		song: null,
	};
	let newTabs =
		activeTabs?.filter((active) => {
			if (active.tabId !== tabId) {
				return true;
			}
			curTab = active;
			return false;
		}) ?? [];

	const connector = await getConnectorByUrl(tab.url ?? '');
	if (connector) {
		newTabs = [curTab, ...newTabs];
	}

	await state.set({
		activeTabs: await filterInactiveTabs(newTabs),
	});
	void updateAction();
});

async function updateTab(
	tabId: number | undefined,
	fn: (tab: ManagerTab) => ManagerTab
) {
	if (!tabId) {
		throw new Error('No tabid given');
	}
	let { activeTabs } = (await state.get()) ?? { activeTabs: [] };
	activeTabs = await filterInactiveTabs(activeTabs);
	for (let i = 0; i < activeTabs.length; i++) {
		if (activeTabs[i].tabId !== tabId) {
			continue;
		}

		activeTabs[i] = fn(activeTabs[i]);
		await state.set({ activeTabs });
	}
	await state.set({
		activeTabs: [
			fn({
				tabId,
				mode: ControllerMode.Unsupported,
				song: null,
			}),
			...activeTabs,
		],
	});
	void updateAction();
}

async function updateMode(tabId: number | undefined, mode: ControllerModeStr) {
	await updateTab(tabId, (oldTab) => ({
		tabId: oldTab.tabId,
		mode,
		song: oldTab.song,
	}));
	void updateAction();
}

async function updateState(tabId: number | undefined, song: Song | null) {
	await updateTab(tabId, (oldTab) => ({
		tabId: oldTab.tabId,
		mode: oldTab.mode,
		song,
	}));
}

setupBackgroundListeners(
	backgroundListener({
		type: 'controllerModeChange',
		fn: (mode, sender) => {
			void updateMode(sender.tab?.id, mode);
			console.log(`changed mode to ${mode} in tab ${sender.tab?.id}`);
		},
	}),
	backgroundListener({
		type: 'songUpdate',
		fn: (song, sender) => {
			void updateState(sender.tab?.id, song);
			console.log(`song changed in tab ${sender.tab?.id}`);
			console.log(song);
		},
	})
);

async function getCurrentTab(): Promise<ManagerTab> {
	const { activeTabs } = (await state.get()) ?? { activeTabs: [] };
	const filteredTabs = await filterInactiveTabs(activeTabs);
	void state.set({
		activeTabs: filteredTabs,
	});

	for (const priorityGroup of controllerModePriority) {
		for (const tab of activeTabs) {
			if (priorityGroup.includes(tab.mode)) {
				return tab;
			}
		}
	}
	return {
		tabId: -1,
		mode: ControllerMode.Unsupported,
		song: null,
	};
}

async function setAction(mode: ControllerModeStr): Promise<void> {
	await browser.action.setIcon({
		path: {
			19: browser.runtime.getURL(
				`icons/page_action_${mode.toLowerCase()}_19.png`
			),
			38: browser.runtime.getURL(
				`icons/page_action_${mode.toLowerCase()}_19.png`
			),
		},
	});
	await browser.action.setTitle({
		title: t(`pageAction${mode}`),
	});
}

async function updateAction() {
	console.log('updating');
	const tab = await getCurrentTab();
	await setAction(tab.mode);
}
