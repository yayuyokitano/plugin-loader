export interface ConnectorMeta {
	label: string;
	matches: string[];
	js: string;
	id: string;
	allFrames?: true;
}

export default <ConnectorMeta[]>[
	{
		label: 'Connector 1',
		matches: ['*://www.youtube.com/*'],
		js: 'youtube.js',
		id: 'connector-1',
	},
	{
		label: 'Connector 2',
		matches: ['*://eggs.mu/*'],
		js: '2.js',
		id: 'connector-2',
	},
];
