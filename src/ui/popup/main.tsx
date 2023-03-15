import { render } from 'solid-js/web';
import styles from './popup.module.scss';
import Unsupported from './unsupported';
import { initializeThemes } from '@/theme/themes';
import '@/theme/themes.scss';

function Popup() {
	return (
		<div class={styles.popup}>
			<Unsupported />
		</div>
	);
}

const root = document.getElementById('root');
if (!root) {
	throw new Error('Root element not found');
}
render(Popup, root);
void initializeThemes();
