'use strict';

import { ServiceCallResult } from '@/object/service-call-result';
import Song from '@/object/song';
import * as Util from '@/util/util';
import { getExtensionVersion } from '@/util/util-browser';
import BaseScrobbler, { SessionData } from '@/scrobbler/base-scrobbler';
import {
	ListenBrainzParams,
	ListenBrainzTrackMeta,
} from './listenbrainz.types';

/**
 * Module for all communication with LB
 */

const listenBrainzTokenPage = 'https://listenbrainz.org/profile/';
const apiUrl = 'https://api.listenbrainz.org/1/submit-listens';
export default class ListenBrainzScrobbler extends BaseScrobbler<'ListenBrainz'> {
	public userApiUrl!: string;
	public userToken!: string;
	/** Can't find where this value is being set from */
	private authUrl!: string;

	public async toggleLove(): Promise<Record<string, never>> {
		return Promise.resolve({});
	}

	public async getSongInfo(): Promise<Record<string, never>> {
		return Promise.resolve({});
	}

	/** @override */
	public async getAuthUrl(): Promise<string> {
		const data = await this.storage.get();
		let properties:
			| {
					userApiUrl: string;
					userToken: string;
			  }
			| undefined;
		if (data && 'properties' in data) {
			properties = data.properties;
		}
		if (properties) {
			await this.storage.set({ isAuthStarted: true, properties });
		} else {
			await this.storage.set({ isAuthStarted: true });
		}

		return 'https://listenbrainz.org/login/musicbrainz?next=%2Fprofile%2F';
	}

	/** @override */
	protected getBaseProfileUrl(): string {
		return 'https://listenbrainz.org/user/';
	}

	/** @override */
	public getLabel(): 'ListenBrainz' {
		return 'ListenBrainz';
	}

	/** @override */
	public async getProfileUrl(): Promise<string> {
		if (this.userToken) {
			return '';
		}

		return await this.getProfileUrl();
	}

	/** @override */
	public getStatusUrl(): string {
		if (this.userToken) {
			return '';
		}

		return 'https://listenbrainz.org/current-status';
	}

	/** @override */
	protected getStorageName(): 'ListenBrainz' {
		return 'ListenBrainz';
	}

	/** @override */
	public getUsedDefinedProperties(): string[] {
		return ['userApiUrl', 'userToken'];
	}

	/** @override */
	public async signOut(): Promise<void> {
		if (this.userApiUrl || this.userToken) {
			await this.applyUserProperties({
				userApiUrl: null,
				userToken: null,
			});
		}
		await super.signOut();
	}

	/** @override */
	public async getSession(): Promise<SessionData> {
		if (this.userToken) {
			return { sessionID: this.userToken };
		}

		const data = await this.storage.get();
		if (!data) {
			this.debugLog('no data', 'error');
			await this.signOut();
			throw ServiceCallResult.ERROR_AUTH;
		}

		if ('isAuthStarted' in data && data.isAuthStarted) {
			try {
				const session = await this.requestSession();

				/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access -- we need to set session even if not exists */
				(data as any).sessionID = session.sessionID;
				(data as any).sessionName = session.sessionName;
				/* eslint-enable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access */
				delete data.isAuthStarted;

				await this.storage.set(data);

				return session;
			} catch (err) {
				this.debugLog('Failed to get session', 'warn');

				await this.signOut();
				throw ServiceCallResult.ERROR_AUTH;
			}
		} else if (!('sessionID' in data) || !data.sessionID) {
			throw ServiceCallResult.ERROR_AUTH;
		}

		return {
			sessionID: data.sessionID,
			sessionName: data.sessionName,
		};
	}

	/** @override */
	public async isReadyForGrantAccess(): Promise<boolean> {
		if (this.userToken) {
			return false;
		}

		const data = await this.storage.get();
		if (!data || !('isAuthStarted' in data)) {
			return false;
		}

		return data.isAuthStarted ?? false;
	}

	/** @override */
	async sendNowPlaying(song: Song): Promise<ServiceCallResult> {
		const { sessionID } = await this.getSession();
		const trackMeta = this.makeTrackMetadata(song);

		const params = {
			listen_type: 'playing_now',
			payload: [
				{
					track_metadata: trackMeta,
				},
			],
		} as ListenBrainzParams;
		return this.sendRequest(params, sessionID);
	}

	/** @override */
	public async scrobble(song: Song): Promise<ServiceCallResult> {
		const { sessionID } = await this.getSession();

		const params = {
			listen_type: 'single',
			payload: [
				{
					listened_at: song.metadata.startTimestamp,
					track_metadata: this.makeTrackMetadata(song),
				},
			],
		} as ListenBrainzParams;
		return this.sendRequest(params, sessionID);
	}

	/** Private methods. */

	private async sendRequest<
		T extends Record<string, unknown> = Record<string, unknown>
	>(
		params: ListenBrainzParams,
		sessionID: string
	): Promise<ServiceCallResult> {
		const requestInfo = {
			method: 'POST',
			headers: {
				Authorization: `Token ${sessionID}`,
				'Content-Type': 'application/json; charset=UTF-8',
			},
			body: JSON.stringify(params),
		};
		const promise = fetch(this.userApiUrl || apiUrl, requestInfo);
		const timeout = this.REQUEST_TIMEOUT;

		let result: T | null = null;
		let response: Response | null = null;

		try {
			response = await Util.timeoutPromise(timeout, promise);
			result = (await response.json()) as T;
		} catch (e) {
			this.debugLog('Error while sending request', 'error');
			throw ServiceCallResult.ERROR_OTHER;
		}

		switch (response.status) {
			case 400:
				this.debugLog('Invalid JSON sent', 'error');
				throw ServiceCallResult.ERROR_AUTH;
			case 401:
				this.debugLog('Invalid Authorization sent', 'error');
				throw ServiceCallResult.ERROR_AUTH;
		}

		this.debugLog(JSON.stringify(result, null, 2));

		return this.processResponse(result);
	}

	private async requestSession() {
		const authUrls = [listenBrainzTokenPage, this.authUrl];

		let session = null;

		for (const url of authUrls) {
			try {
				session = await this.fetchSession(url);
			} catch (e) {
				this.debugLog('request session timeout', 'warn');
				continue;
			}

			if (session) {
				break;
			}
		}

		if (session) {
			const safeId = Util.hideObjectValue(session.sessionID);
			this.debugLog(`Session ID: ${safeId}`);

			return session;
		}

		throw ServiceCallResult.ERROR_AUTH;
	}

	private async fetchSession(url: string) {
		this.debugLog(`Use ${url}`);
		// NOTE: Use 'same-origin' credentials to fix login on Firefox ESR 60.
		const promise = fetch(url, {
			method: 'GET',
			credentials: 'same-origin',
		});
		const timeout = this.REQUEST_TIMEOUT;

		const response = await Util.timeoutPromise(timeout, promise);

		if (response.ok) {
			const parser = new DOMParser();

			const rawHtml = await response.text();
			const doc = parser.parseFromString(rawHtml, 'text/html');

			let sessionName = null;
			let sessionID = null;
			const sessionNameEl = doc.querySelector('.page-title');
			const sessionIdEl = doc.querySelector('#auth-token');

			if (sessionNameEl) {
				sessionName = sessionNameEl.textContent;
			}
			if (sessionIdEl) {
				sessionID = sessionIdEl.getAttribute('value');
			}

			if (sessionID && sessionName) {
				return { sessionID, sessionName };
			}
		}

		return null;
	}

	private processResponse(
		result: Record<string, unknown>
	): ServiceCallResult {
		if (result.status !== 'ok') {
			return ServiceCallResult.ERROR_OTHER;
		}

		return ServiceCallResult.RESULT_OK;
	}

	private makeTrackMetadata(song: Song): ListenBrainzTrackMeta {
		const trackMeta: ListenBrainzTrackMeta = {
			artist_name: song.getArtist() ?? '',
			track_name: song.getTrack() ?? '',
			additional_info: {
				submission_client: 'Web Scrobbler',
				submission_client_version: getExtensionVersion(),
				music_service_name: song.metadata.label,
			},
		};

		const album = song.getAlbum();
		if (album) {
			trackMeta.release_name = album;
		}

		const originUrl = song.getOriginUrl();
		if (originUrl) {
			trackMeta.additional_info.origin_url = originUrl;
		}

		const albumArtist = song.getAlbumArtist();
		if (albumArtist) {
			trackMeta.additional_info.release_artist_name = albumArtist;
		}

		if (originUrl && song.metadata.label === 'Spotify') {
			trackMeta.additional_info.spotify_id = originUrl;
		}

		const duration = song.getDuration();
		if (duration) {
			trackMeta.additional_info.duration = duration;
		}

		return trackMeta;
	}
}
