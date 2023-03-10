import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import solid from 'vite-plugin-solid';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import compileConnectors from './scripts/compile-connectors';
import { resolve } from 'path';

const root = resolve(__dirname, 'src');

export default defineConfig({
	resolve: {
		alias: [
			{ find: '@', replacement: '/src' },
			{ find: '#', replacement: '/tests' },
		],
	},
	build: {
		minify: false,
	},
	plugins: [
		solid(),
		crx({ manifest }),
		compileConnectors(),
		viteStaticCopy({
			targets: [
				{
					src: resolve(root, '_locales'),
					dest: '',
				},
			],
		}),
	],
});
