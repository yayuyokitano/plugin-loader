import { getConnectorByUrl } from './util-connector';
import BaseConnector from '@/core/content/connector';
import * as Util from '@/core/content/util';
import * as MetadataFilter from 'metadata-filter';
import start from '@/core/content/starter';

window.Connector = new BaseConnector();
window.Util = Util;
window.MetadataFilter = MetadataFilter;
window.webScrobblerScripts = {};

main();

async function main() {
	try {
		await fetchConnector();
	} catch (err) {
		Util.debugLog(err, 'error');
		return;
	}
	start();
}

async function fetchConnector() {
	const connector = await getConnectorByUrl(window.location.href);
	if (!connector) {
		return;
	}
	try {
		await import(`../connectors/${connector?.js}`);
		Util.debugLog(`Successfully loaded ${connector.label} connector`);
	} catch (err) {
		Util.debugLog(
			`An error occured while loading ${connector.label} connector`,
			'error'
		);
		throw err;
	}
}
