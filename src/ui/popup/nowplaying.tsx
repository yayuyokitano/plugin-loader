import { t } from '@/util/i18n';
import styles from './popup.module.scss';
import { Resource } from 'solid-js';
import { ManagerTab } from '@/storage/wrapper';
import browser from 'webextension-polyfill';
import ClonedSong from '@/object/cloned-song';
import Base from './base';

export default function NowPlaying(props: { tab: Resource<ManagerTab> }) {
	const { tab } = props;
	const rawTab = tab();
	if (!rawTab) {
		return <Base />;
	}

	const rawSong = rawTab.song;
	if (!rawSong) {
		return <Base />;
	}

	const song = new ClonedSong(rawSong, rawTab.tabId);
	return (
		<div class={styles.nowPlayingPopup}>
			<img
				src={
					song.getTrackArt() ??
					browser.runtime.getURL('icons/cover_art_default.png')
				}
			/>
			<p>{song.getTrack()}</p>
			<p>{song.getArtist()}</p>
			<p>{song.getAlbum()}</p>
			<p>{song.getAlbumArtist()}</p>
		</div>
	);
}
