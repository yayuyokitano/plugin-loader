import type ConnectorClass from '@/core/content/connector';

declare global {
	var Connector: ConnectorClass;
	var Util: typeof import('@/core/content/util');
	var MetadataFilter: typeof import('metadata-filter');
	var webScrobblerScripts: { [scriptFile: string]: boolean };
	var STARTER_LOADED: boolean | undefined;
}
