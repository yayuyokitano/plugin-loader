import type { ManifestV3Export } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default <ManifestV3Export>{
	manifest_version: 3,
	name: 'Plugin Loader',
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
};
