import { t } from '@/util/i18n';
import { ScrobblerModels } from '@/storage/wrapper';
import ScrobbleService, {
	Scrobbler,
	ScrobblerLabel,
} from '@/object/scrobble-service';
import { ErrorBoundary, Show, createResource, onCleanup } from 'solid-js';
import styles from './components.module.scss';
import browser from 'webextension-polyfill';

export default function Accounts() {
	return (
		<>
			<h1>{t('optionsAccounts')}</h1>
			<ScrobblerDisplay label="Last.fm" />
			<ScrobblerDisplay label="Libre.fm" />
			<ScrobblerDisplay label="ListenBrainz" />
			<ScrobblerDisplay label="Maloja" />
		</>
	);
}

function ScrobblerDisplay(props: { label: ScrobblerLabel }) {
	const { label } = props;
	const rawScrobbler = ScrobbleService.getScrobblerByLabel(label);
	if (!rawScrobbler) return <></>;
	const [session, setSession] = createResource(
		rawScrobbler.getSession.bind(rawScrobbler)
	);
	const [profileUrl, setProfileUrl] = createResource(
		rawScrobbler.getProfileUrl.bind(rawScrobbler)
	);

	const onFocus = async () => {
		if (await rawScrobbler.isReadyForGrantAccess()) {
			await rawScrobbler.getSession();
			setSession.refetch();
			setProfileUrl.refetch();
		}
	};
	window.addEventListener('focus', onFocus);
	onCleanup(() => window.removeEventListener('focus', onFocus));

	return (
		<>
			<ErrorBoundary
				fallback={(err) => {
					console.error(err);
					return <SignedOut scrobbler={rawScrobbler} />;
				}}
			>
				<Show when={session()}>
					<h2>{rawScrobbler.getLabel()}</h2>
					<p>
						{t(
							'accountsSignedInAs',
							session()?.sessionName || 'anonymous'
						)}
					</p>
					<a
						class={styles.linkButton}
						href={profileUrl()}
						target="_blank"
						rel="noopener noreferrer"
					>
						{t('accountsProfile')}
					</a>
					<button
						class={styles.resetButton}
						onClick={async () => {
							await rawScrobbler.signOut();
							setSession.refetch();
							setProfileUrl.refetch();
						}}
					>
						{t('accountsSignOut')}
					</button>
				</Show>
				<Show when={!session()}>
					<SignedOut scrobbler={rawScrobbler} />
				</Show>
			</ErrorBoundary>
		</>
	);
}

function SignedOut(props: { scrobbler: Scrobbler }) {
	const { scrobbler } = props;
	return (
		<>
			<h2>{scrobbler.getLabel()}</h2>
			<p>{t('accountsNotSignedIn')}</p>
			<button
				class={styles.resetButton}
				onClick={async () => {
					const url = await scrobbler.getAuthUrl();
					if (!url) return new Error('No auth URL');
					await browser.tabs.create({ url });
				}}
			>
				{t('accountsSignIn')}
			</button>
		</>
	);
}
