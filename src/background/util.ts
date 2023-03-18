import { getConnectorByUrl } from '@/core/content/util-connector';
import { ManagerTab, StateManagement } from '@/storage/wrapper';
import browser from 'webextension-polyfill';

/**
 * Filters asynchronously. Parallelized.
 *
 * @param arr - The array to filter
 * @param filter - The filtering function
 * @returns A promise that will resolve to the array without the entries where filter returned false.
 */
export async function filterAsync<T>(
	arr: T[],
	filter: (entry: T) => Promise<boolean>
): Promise<T[]> {
	if (!arr) {
		return [];
	}

	const filters = [];
	for (const entry of arr) {
		filters.push(filter(entry));
	}
	const filteredArr = [];
	for (const [index, shouldKeep] of (await Promise.all(filters)).entries()) {
		if (shouldKeep) {
			filteredArr.push(arr[index]);
		}
	}
	return filteredArr;
}

/**
 * Checks if the tab is still active and supported.
 *
 * @param tab - State Manager tab instance
 * @returns true if tab is still open and on a URL that web scrobbler supports, false otherwise
 */
async function checkIfActive(tab: ManagerTab) {
	try {
		const tabDetails = await browser.tabs.get(tab.tabId);
		const connector = await getConnectorByUrl(tabDetails.url ?? '');
		return Boolean(connector);
	} catch (err) {
		return false;
	}
}

/**
 * Update all tabs of state storage
 *
 * @param state - State Management storage content
 * @returns State Management storage content without inactive tabs and with state updated
 */
async function updateTabs(state: StateManagement): Promise<StateManagement> {
	state.activeTabs = await filterAsync(state.activeTabs, checkIfActive);
	return state;
}
/*
async function updateState(tab:ManagerTab) {
	const state =
}
*/
/**
 * Update all tab states
 *
 * @param state - State management storage content
 * @returns State Management storage content with state contents updated
 */
/*
async function updateTabState(
	state: StateManagement
): Promise<StateManagement> {
	const newActiveTabs = state.activeTabs.map()
}
*/
