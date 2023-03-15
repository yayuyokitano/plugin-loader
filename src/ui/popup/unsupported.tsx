import { t } from '@/util/i18n';
import SentimentDissatisfied from '@suid/icons-material/SentimentDissatisfiedOutlined';
import styles from './popup.module.scss';
import { createSignal, lazy, Suspense } from 'solid-js';
import browser from 'webextension-polyfill';

const ActiveConnector = lazy(async () => {
	let [active, setActive] = createSignal('');
	setActive(
		await browser.runtime.sendMessage({ type: 'getActiveConnector' })
	);
	return {
		default: () => (
			<div>
				<button
					onClick={async () => {
						const a = await browser.runtime.sendMessage({
							type: 'getActiveConnector',
						});
						console.log(a);
						setActive(a);
					}}
				>
					refresh
				</button>
				<p>{active || 'None'}</p>
			</div>
		),
	};
});

export default function Unsupported() {
	return (
		<div class={styles.alertPopup}>
			<SentimentDissatisfied class={styles.bigIcon} />
			<h1>{t('unsupportedWebsiteHeader')}</h1>
			<p class="description">{t('unsupportedWebsiteDesc')}</p>
			<p class="description mb-0">
				<span>{t('unsupportedWebsiteDesc2')} </span>
				<a
					target="_blank"
					href="https://cloud.google.com/docs/chrome-enterprise/policies/?policy=ExtensionSettings"
				>
					{t('learnMoreLabel')}
				</a>
			</p>
			<Suspense fallback={<span>Loading...</span>}>
				<ActiveConnector />
			</Suspense>
		</div>
	);
}
