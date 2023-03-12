import Song from '@/object/song';
import browser from 'webextension-polyfill';

interface BackgroundCommunications {
	nowPlaying: {
		payload: undefined;
		response: Song | null;
	};
}

interface ContentCommunications {
	startedPlaying: {
		payload: Song;
		response: void;
	};
	scrobbled: {
		payload: Song;
		response: void;
	};
}

export async function sendMessage<K extends keyof BackgroundCommunications>(
	tabId: number,
	type: K,
	payload: BackgroundCommunications[K]['payload']
): Promise<BackgroundCommunications[K]['response']> {
	return browser.tabs.sendMessage(tabId, {
		type,
		payload,
	});
}

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
