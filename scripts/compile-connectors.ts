import { exec } from 'child_process';
import { PluginOption } from 'vite';
import fs from 'fs-extra';
import colorLog from './log';

export default function compileConnectors(): PluginOption {
	return {
		name: 'compile-connectors',
		buildEnd() {
			exec('tsc --project tsconfig.connectors.json', (err) => {
				if (err) {
					colorLog(err, 'error');
					return;
				}
				colorLog('Connector file compilation complete', 'success');

				try {
					fs.moveSync(
						'dist/connectorraw/connectors',
						'dist/connectors'
					);
					fs.removeSync('dist/connectorraw');
					colorLog('Connector files moved', 'success');
				} catch (err) {
					colorLog(err, 'error');
					return;
				}
			});
		},
	};
}
