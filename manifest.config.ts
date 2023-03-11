import type { ManifestV3Export } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default <ManifestV3Export>{
	manifest_version: 3,
	name: 'Plugin Loader',
	default_locale: 'en',
	description: '__MSG_extDescription__',
	version: pkg.version,
	permissions: ['scripting', 'storage'],
	host_permissions: ['http://*/', 'https://*/'],

	content_scripts: [
		{
			matches: ['<all_urls>'],
			js: ['src/core/content/main.ts'],
			all_frames: true,
		},
	],

	web_accessible_resources: [
		{
			resources: ['connectors/*'],
			matches: ['<all_urls>'],
		},
	],

	action: {
		default_icon: {
			'19': 'src/icons/page_action_unsupported_19.png',
			'38': 'src/icons/page_action_unsupported_38.png',
		},
		default_title: '__MSG_pageActionUnsupported__',
		default_popup: 'src/ui/popup/index.html',
	},

	background: {
		service_worker: 'src/background/main',
	},
};
