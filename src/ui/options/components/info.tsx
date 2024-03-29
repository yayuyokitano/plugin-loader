import { currentChangelog, t } from '@/util/i18n';

export default function InfoComponent() {
	return (
		<>
			<h1>{t('optionsAbout')}</h1>
			<p>{t('aboutExtensionDesc')}</p>
			<p innerHTML={t('aboutChangelog', currentChangelog())}></p>
			<h2>{t('contributorsTitle')}</h2>
			<p innerHTML={t('contributorsText')}></p>
		</>
	);
}
