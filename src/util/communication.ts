import { ControllerModeStr } from '@/object/controller/controller';
import { CloneableSong } from '@/object/song';
import { ManagerTab } from '@/storage/wrapper';
import browser from 'webextension-polyfill';

interface PopupCommunications {
	currentTab: {
		payload: ManagerTab;
		response: void;
	};
}

interface ContentCommunications {
	controllerModeChange: {
		payload: ControllerModeStr;
		response: void;
	};
	songUpdate: {
		payload: CloneableSong | null;
		response: void;
	};
}

interface BackgroundCommunications {
	resetData: {
		payload: undefined;
		response: void;
	};
	resetInfo: {
		payload: undefined;
		response: void;
	};
	toggleLove: {
		payload: {
			isLoved: boolean;
		};
		response: void;
	};
	skipCurrentSong: {
		payload: undefined;
		response: void;
	};
	reprocessSong: {
		payload: undefined;
		response: void;
	};
	setEditState: {
		payload: boolean;
		response: void;
	};
	setConnectorState: {
		payload: boolean;
		response: void;
	};
}

/**
 * Content listeners
 */

interface SpecificContentListener<K extends keyof BackgroundCommunications> {
	type: K;
	fn: (
		payload: BackgroundCommunications[K]['payload'],
		sender: browser.Runtime.MessageSender
	) => BackgroundCommunications[K]['response'];
	sendsResponse?: boolean;
}

type ContentListener = <R>(
	cont: <T extends keyof BackgroundCommunications>(
		prop: SpecificContentListener<T>
	) => R
) => R;

export function contentListener<T extends keyof BackgroundCommunications>(
	property: SpecificContentListener<T>
): ContentListener {
	return <R>(
		cont: <T extends keyof BackgroundCommunications>(
			prop: SpecificContentListener<T>
		) => R
	) => cont(property);
}

interface BackgroundMessage<K extends keyof BackgroundCommunications> {
	type: K;
	payload: BackgroundCommunications[K]['payload'];
}

export function setupContentListeners(...listeners: ContentListener[]) {
	browser.runtime.onMessage.addListener(
		(message: BackgroundMessage<any>, sender, sendResponse) => {
			let done = false;
			for (const l of listeners) {
				if (done) {
					break;
				}
				l((listener) => {
					if (message.type !== listener.type) {
						return;
					}
					done = true;
					if (listener.sendsResponse) {
						sendResponse();
					}
					listener.fn(message.payload, sender);
				});
			}
		}
	);
}

export async function sendBackgroundMessage<
	K extends keyof BackgroundCommunications
>(
	tabId: number,
	message: BackgroundMessage<K>
): Promise<BackgroundCommunications[K]['response']> {
	return browser.tabs.sendMessage(tabId, message);
}

/**
 * Background listeners
 */

interface SpecificBackgroundListener<K extends keyof ContentCommunications> {
	type: K;
	fn: (
		payload: ContentCommunications[K]['payload'],
		sender: browser.Runtime.MessageSender
	) => ContentCommunications[K]['response'];
	sendsResponse?: boolean;
}

type BackgroundListener = <R>(
	cont: <T extends keyof ContentCommunications>(
		prop: SpecificBackgroundListener<T>
	) => R
) => R;

export function backgroundListener<T extends keyof ContentCommunications>(
	property: SpecificBackgroundListener<T>
): BackgroundListener {
	return <R>(
		cont: <T extends keyof ContentCommunications>(
			prop: SpecificBackgroundListener<T>
		) => R
	) => cont(property);
}

interface ContentMessage<K extends keyof ContentCommunications> {
	type: K;
	payload: ContentCommunications[K]['payload'];
}

export function setupBackgroundListeners(...listeners: BackgroundListener[]) {
	browser.runtime.onMessage.addListener(
		(message: ContentMessage<any>, sender, sendResponse) => {
			let done = false;
			for (const l of listeners) {
				if (done) {
					break;
				}
				l((listener) => {
					if (message.type !== listener.type) {
						return;
					}
					done = true;
					if (listener.sendsResponse) {
						sendResponse();
					}
					listener.fn(message.payload, sender);
				});
			}
		}
	);
}

export async function sendContentMessage<K extends keyof ContentCommunications>(
	message: ContentMessage<K>
): Promise<ContentCommunications[K]['response']> {
	return browser.runtime.sendMessage(message);
}

/**
 * popup listeners
 */

interface SpecificPopupListener<K extends keyof PopupCommunications> {
	type: K;
	fn: (
		payload: PopupCommunications[K]['payload'],
		sender: browser.Runtime.MessageSender
	) => PopupCommunications[K]['response'];
	sendsResponse?: boolean;
}

type PopupListener = <R>(
	cont: <T extends keyof PopupCommunications>(
		prop: SpecificPopupListener<T>
	) => R
) => R;

export function popupListener<T extends keyof PopupCommunications>(
	property: SpecificPopupListener<T>
): PopupListener {
	return <R>(
		cont: <T extends keyof PopupCommunications>(
			prop: SpecificPopupListener<T>
		) => R
	) => cont(property);
}

interface PopupMessage<K extends keyof PopupCommunications> {
	type: K;
	payload: PopupCommunications[K]['payload'];
}

export function setupPopupListeners(...listeners: PopupListener[]) {
	browser.runtime.onMessage.addListener(
		(message: PopupMessage<any>, sender, sendResponse) => {
			let done = false;
			for (const l of listeners) {
				if (done) {
					break;
				}
				l((listener) => {
					if (message.type !== listener.type) {
						return;
					}
					done = true;
					if (listener.sendsResponse) {
						sendResponse();
					}
					listener.fn(message.payload, sender);
				});
			}
		}
	);
}

export async function sendPopupMessage<K extends keyof PopupCommunications>(
	message: PopupMessage<K>
): Promise<PopupCommunications[K]['response']> {
	return browser.runtime.sendMessage(message);
}
