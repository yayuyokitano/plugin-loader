import BaseConnector from '@/core/content/connector';
import browser from 'webextension-polyfill';
import { State } from '@/core/types';
import * as Util from '@/core/content/util';

/**
 * Reactor object reacts to changes in supplied connector
 * and communicates with background script as necessary.
 */
export default class Reactor {
	private connector: BaseConnector;

	/**
	 * @param connector - Connector object
	 */
	constructor(connector: BaseConnector) {
		this.connector = connector;

		console.log('binding');
		// Setup listening for state changes on connector.
		connector.controllerCallback = this.onStateChanged.bind(this);
	}

	/**
	 * Listen for state changes on connector and determines further actions.
	 * @param state - Connector state
	 */
	private onStateChanged(state: State) {
		console.log(state);
	}
}
