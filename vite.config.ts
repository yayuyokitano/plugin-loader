import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.config';
import compileConnectors from './scripts/compile-connectors';

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
	plugins: [crx({ manifest }), compileConnectors()],
});
