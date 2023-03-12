import BaseConnector from '@/core/content/connector';
import browser from 'webextension-polyfill';
import { State } from '@/core/types';
import * as Util from '@/core/content/util';
import Controller from '@/object/controller/controller';
import { ConnectorMeta } from '../connectors';

/**
 * Reactor object reacts to changes in supplied connector
 * and communicates with background script as necessary.
 */
export default class Reactor {
	private controller: Controller;

	/**
	 * @param connector - Connector object
	 */
	constructor(connector: BaseConnector) {
		this.controller = new Controller(connector.meta, true);

		console.log('binding');
		// Setup listening for state changes on connector.
		connector.controllerCallback = this.onStateChanged.bind(this);
	}

	/**
	 * Listen for state changes on connector and determines further actions.
	 * @param state - Connector state
	 */
	private onStateChanged(state: State) {
		this.controller.onStateChanged(state);
	}
}
