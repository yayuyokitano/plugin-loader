import { getConnectorByUrl } from './util-connector';
import ConnectorClass from '@/core/content/connector';
import * as Util from '@/core/content/util';

window.Connector = new ConnectorClass();
window.Util = Util;
window.webScrobblerScripts = {};

fetchConnector();

async function fetchConnector() {
	const connector = await getConnectorByUrl(window.location.href);
	console.log(connector?.label);
	if (!connector) {
		return;
	}
	await import(`../connectors/${connector?.js}`);
	console.log(Connector.getTrackInfo());
}
