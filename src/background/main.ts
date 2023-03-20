import { getConnectorByUrl } from '@/core/content/util-connector';
import * as ControllerMode from '@/object/controller/controller-mode';
import * as BrowserStorage from '@/storage/browser-storage';
import { ManagerTab } from '@/storage/wrapper';
import {
	backgroundListener,
	sendBackgroundMessage,
	sendPopupMessage,
	setupBackgroundListeners,
} from '@/util/communication';
import browser from 'webextension-polyfill';
import { fetchTab, filterInactiveTabs, getCurrentTab } from './util';
import { ControllerModeStr } from '@/object/controller/controller';
import Song, { CloneableSong } from '@/object/song';
import { t } from '@/util/i18n';

const contextMenus = {
	ENABLE_CONNECTOR: 'enableConnector',
	DISABLE_CONNECTOR: 'disableConnector',
};

const state = BrowserStorage.getStorage(BrowserStorage.STATE_MANAGEMENT);

browser.runtime.onStartup.addListener(startupFunc);
browser.runtime.onInstalled.addListener(startupFunc);

browser.tabs.onRemoved.addListener(async () => {
	const activeTabs = await fetchTab();

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

	// perform the update, making sure there is no race condition, and making sure locking isnt permanently locked by an error
	let performedSet = false;
	try {
		let { activeTabs } = (await state.get(true)) ?? { activeTabs: [] };
		activeTabs = await filterInactiveTabs(activeTabs);
		for (let i = 0; i < activeTabs.length; i++) {
			if (activeTabs[i].tabId !== tabId) {
				continue;
			}

			activeTabs[i] = fn(activeTabs[i]);
			performedSet = true;
			await state.set({ activeTabs }, true);
			void updateAction();
			return;
		}
		performedSet = true;
		await state.set(
			{
				activeTabs: [
					fn({
						tabId,
						mode: ControllerMode.Unsupported,
						song: null,
					}),
					...activeTabs,
				],
			},
			true
		);
		void updateAction();
	} catch (err) {
		if (!performedSet) {
			state.unlock();
		}
	}
}

async function updateMode(tabId: number | undefined, mode: ControllerModeStr) {
	await updateTab(tabId, (oldTab) => ({
		tabId: oldTab.tabId,
		mode,
		song: oldTab.song,
	}));
	void updateAction();
}

async function updateState(
	tabId: number | undefined,
	song: CloneableSong | null
) {
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
	const tab = await getCurrentTab();
	sendPopupMessage({
		type: 'currentTab',
		payload: tab,
	});
	await updateMenus(tab);
	await setAction(tab.mode);
}

async function updateMenus(tab: ManagerTab) {
	if (tab.mode === ControllerMode.Unsupported) {
		void browser.contextMenus.update(contextMenus.ENABLE_CONNECTOR, {
			visible: false,
		});
		void browser.contextMenus.update(contextMenus.DISABLE_CONNECTOR, {
			visible: false,
		});
		return;
	}

	const tabData = await browser.tabs.get(tab.tabId);
	const connector = await getConnectorByUrl(tabData.url ?? '');
	if (tab.mode === ControllerMode.Disabled) {
		void browser.contextMenus.update(contextMenus.ENABLE_CONNECTOR, {
			visible: true,
			title: t('menuEnableConnector', connector?.label),
		});
		void browser.contextMenus.update(contextMenus.DISABLE_CONNECTOR, {
			visible: false,
		});
		return;
	}

	void browser.contextMenus.update(contextMenus.ENABLE_CONNECTOR, {
		visible: false,
	});
	void browser.contextMenus.update(contextMenus.DISABLE_CONNECTOR, {
		visible: true,
		title: t('menuDisableConnector', connector?.label),
	});
}

function startupFunc() {
	state.set({
		activeTabs: [],
	});

	browser.contextMenus.create({
		id: contextMenus.ENABLE_CONNECTOR,
		visible: false,
		contexts: ['action'],
		title: 'Error: You should not be seeing this',
	});

	browser.contextMenus.create({
		id: contextMenus.DISABLE_CONNECTOR,
		visible: false,
		contexts: ['action'],
		title: 'Error: You should not be seeing this',
	});

	browser.contextMenus.onClicked.addListener(async (info) => {
		const tab = await getCurrentTab();

		switch (info.menuItemId) {
			case contextMenus.ENABLE_CONNECTOR: {
				sendBackgroundMessage(tab.tabId ?? -1, {
					type: 'setConnectorState',
					payload: true,
				});
				break;
			}
			case contextMenus.DISABLE_CONNECTOR: {
				sendBackgroundMessage(tab.tabId ?? -1, {
					type: 'setConnectorState',
					payload: false,
				});
			}
		}
	});
}
